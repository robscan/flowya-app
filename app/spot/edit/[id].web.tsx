import "@/styles/mapbox-attribution-overrides.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { default as MapGL, Marker } from "react-map-gl/mapbox-legacy";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { IconButton } from "@/components/design-system/icon-button";
import {
  MapLocationPicker,
  type MapLocationPickerResult,
} from "@/components/design-system/map-location-picker";
import { MapPinSpot } from "@/components/design-system/map-pins";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import {
  Colors,
  Radius,
  Spacing,
  WebTouchManipulation,
} from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getStablePlaceId,
  inferTappedKindFromPlace,
} from "@/lib/explore/map-screen-orchestration";
import { getMapSpotDeepLink } from "@/lib/explore-deeplink";
import { blurActiveElement } from "@/lib/focus-management";
import { WEB_SHEET_MAX_WIDTH } from "@/lib/web-layout";
import { featureFlags } from "@/lib/feature-flags";
import { sanitizeCameraBBoxForPoint } from "@/lib/places/cameraBBox";
import { resolveCameraFramingForPointName } from "@/lib/places/resolveCameraFraming";
import { resolveSpotLink, SPOT_LINK_VERSION } from "@/lib/spot-linking/resolveSpotLink";
import { optimizeSpotImage } from "@/lib/spot-image-optimize";
import { createSerialQueue } from "@/lib/async/serial-queue";
import {
  MAX_SPOT_GALLERY_IMAGES,
  addSpotImageRow,
  ensureGallerySeedFromCover,
  getSpotImagePublicUrl,
  listSpotImages,
  removeSpotImage,
  reorderSpotImages,
  syncCoverFromGallery,
  type SpotImageRow,
} from "@/lib/spot-images";
import { uploadSpotCover, uploadSpotGalleryImage } from "@/lib/spot-image-upload";
import { supabase } from "@/lib/supabase";
import { SpotImage } from "@/components/design-system/spot-image";
import { createCountToastBatcher } from "@/lib/ui/toast-batcher";
import { AddImageCta } from "@/components/design-system/add-image-cta";
import { SharePhotosConsentModal } from "@/components/ui/share-photos-consent-modal";
import {
  fetchMyPhotoSharingPreference,
  persistMyPhotoSharingPreference,
} from "@/lib/photo-sharing/consent";
import {
  addSpotPersonalImageRow,
  createSpotPersonalImageSignedUrl,
  listSpotPersonalImages,
} from "@/lib/spot-personal-images";
import { uploadSpotPersonalGalleryImage } from "@/lib/spot-personal-image-upload";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_SPOT_HEIGHT = 320;
const MAP_CONTROLS_PADDING = 8;
/** Límites de tamaño de celda en grid responsivo (edición galería). */
const GALLERY_MIN_THUMB = 96;
const GALLERY_MAX_THUMB = 200;

function pickImageFilesFromWeb({
  multiple,
}: {
  multiple: boolean;
}): Promise<File[] | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  return new Promise<File[] | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    let settled = false;
    let focusListenerActive = false;
    let fallbackTimer: number | null = null;
    let focusCancelTimer: number | null = null;

    const onWindowFocus = () => {
      // En algunos navegadores (sobre todo móvil) `focus` puede dispararse antes de que `change`
      // termine de poblar `input.files`. Esperar un poco antes de tratarlo como cancelación.
      if (focusCancelTimer != null) {
        window.clearTimeout(focusCancelTimer);
      }
      focusCancelTimer = window.setTimeout(() => {
        const hasFile = (input.files?.length ?? 0) > 0;
        if (!settled && !hasFile) finalize(null);
      }, 350);
    };

    const finalize = (files: File[] | null) => {
      if (settled) return;
      settled = true;
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (focusCancelTimer != null) {
        window.clearTimeout(focusCancelTimer);
        focusCancelTimer = null;
      }
      if (focusListenerActive) {
        window.removeEventListener("focus", onWindowFocus);
        focusListenerActive = false;
      }
      input.onchange = null;
      input.remove();
      resolve(files);
    };

    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      finalize(files.length > 0 ? files : null);
    };

    document.body.appendChild(input);
    window.addEventListener("focus", onWindowFocus);
    focusListenerActive = true;
    input.click();
    // Último recurso (algunos navegadores no disparan focus/change de forma consistente).
    // Nota: no usar un timeout corto; en móvil el selector puede tardar bastante.
    fallbackTimer = window.setTimeout(() => finalize(null), 60_000);
  });
}

function galleryLayoutMetrics(containerWidth: number) {
  const gap = Spacing.sm;
  const w = containerWidth > 0 ? containerWidth : 360;
  let cols = 5;
  let thumb = 0;
  while (cols >= 2) {
    thumb = Math.floor((w - gap * (cols - 1)) / cols);
    if (thumb >= GALLERY_MIN_THUMB) break;
    cols -= 1;
  }
  thumb = Math.min(GALLERY_MAX_THUMB, Math.max(GALLERY_MIN_THUMB, thumb));
  return { gap, thumb };
}

type SpotEdit = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  mapbox_bbox?: {
    west: number;
    south: number;
    east: number;
    north: number;
  } | null;
  mapbox_feature_type?: string | null;
};

/** Re-consulta el spot por id (sin filtrar is_hidden) y loguea en __DEV__. */
async function verifySpotInDb(
  spotId: string,
  kind: "save" | "delete",
): Promise<void> {
  if (!__DEV__) return;
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, title, description_short, description_long, latitude, longitude, address, is_hidden, updated_at",
    )
    .eq("id", spotId)
    .single();
  if (error) {
    console.warn(`[edit-spot] verify ${kind} failed`, { spotId, error: error.message });
    return;
  }
  if (kind === "save") {
    console.warn("[edit-spot] verify after save", {
      spotId: data?.id,
      title: data?.title,
      description_short: data?.description_short,
      description_long: data?.description_long,
      latitude: data?.latitude,
      longitude: data?.longitude,
      address: data?.address,
      updated_at: data?.updated_at,
    });
  } else {
    console.warn("[edit-spot] verify after delete", {
      spotId: data?.id,
      is_hidden: data?.is_hidden,
      updated_at: data?.updated_at,
    });
  }
}

function EditSpotMapSlot({
  latitude,
  longitude,
  onEditLocation,
}: {
  latitude: number;
  longitude: number;
  onEditLocation: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const mapStyle =
    colorScheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";

  if (!MAPBOX_TOKEN) {
    return (
      <View
        style={[
          styles.mapPlaceholder,
          { backgroundColor: Colors.light.border },
        ]}
      >
        <Text
          style={[
            styles.mapPlaceholderText,
            { color: Colors.light.textSecondary },
          ]}
        >
          Mapa (configura EXPO_PUBLIC_MAPBOX_TOKEN)
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapGL
        key={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        initialViewState={{ longitude, latitude, zoom: 14 }}
        style={styles.map}
        interactive={false}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="center">
          <MapPinSpot status="default" />
        </Marker>
      </MapGL>
      <View style={[styles.editMapOverlay, { pointerEvents: "box-none" }]}>
        <Pressable
          style={({ pressed }) => [
            styles.editLocationButton,
            {
              borderColor: colors.border,
              backgroundColor: pressed
                ? colors.backgroundElevated
                : "transparent",
            },
            WebTouchManipulation,
          ]}
          onPress={onEditLocation}
          accessibilityLabel="Editar ubicación"
          accessibilityRole="button"
        >
          <MapPin size={18} color={colors.text} strokeWidth={2} />
          <Text
            style={[styles.editLocationButtonLabel, { color: colors.text }]}
          >
            Editar ubicación
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function EditSpotScreenWeb() {
  const { id, returnTo } = useLocalSearchParams<{
    id: string;
    returnTo?: string;
  }>();
  const router = useRouter();
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spot, setSpot] = useState<SpotEdit | null>(null);
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryRows, setGalleryRows] = useState<SpotImageRow[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [photoShareConsentOpen, setPhotoShareConsentOpen] = useState(false);
  const [photoShareConsentBusy, setPhotoShareConsentBusy] = useState(false);
  const pendingPhotoShareResolverRef = useRef<((choice: boolean | null) => void) | null>(
    null,
  );
  const resolvePhotoSharingOrAskOnce = useCallback(async (): Promise<boolean | null> => {
    const { pref } = await fetchMyPhotoSharingPreference();
    if (pref === true || pref === false) return pref;
    return await new Promise<boolean | null>((resolve) => {
      pendingPhotoShareResolverRef.current = resolve;
      setPhotoShareConsentOpen(true);
    });
  }, []);
  const [deletingImageIds, setDeletingImageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const deletingImageIdsRef = useRef(deletingImageIds);
  deletingImageIdsRef.current = deletingImageIds;
  const coverSyncQueueRef = useRef(createSerialQueue());
  const deleteGalleryToastRef = useRef(
    createCountToastBatcher({
      show: toast.show,
      messageForCount: (n) => (n === 1 ? "Foto eliminada" : `${n} fotos eliminadas`),
      showOptions: { type: "error", replaceVisible: true },
    }),
  );
  const [locationDraft, setLocationDraft] =
    useState<MapLocationPickerResult | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [galleryGridWidth, setGalleryGridWidth] = useState(0);
  const screenRootRef = useRef<View>(null);

  const { gap: galleryGap, thumb: galleryThumbSize } =
    galleryLayoutMetrics(galleryGridWidth);

  /** Evita aria-hidden en ancestro mientras un botón de la pantalla anterior conserva foco (web). */
  const blurIfFocusOutsideScreenRoot = useCallback(() => {
    if (typeof document === "undefined") return;
    const active = document.activeElement as HTMLElement | null;
    const root = screenRootRef.current as unknown as HTMLElement | null;
    if (!active || !root || typeof root.contains !== "function") return;
    if (!root.contains(active)) {
      blurActiveElement();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const id = requestAnimationFrame(() => {
        if (typeof document === "undefined") return;
        const root = screenRootRef.current as unknown as HTMLElement | null;
        // Mientras loading/error sin ref, el foco puede seguir en el sheet (aria-hidden).
        if (!root) {
          blurActiveElement();
          return;
        }
        blurIfFocusOutsideScreenRoot();
      });
      return () => cancelAnimationFrame(id);
    }, [blurIfFocusOutsideScreenRoot]),
  );

  /** Tras cargar el spot, el ref del root ya existe; sin esto el primer useFocusEffect podía no alcanzar el árbol. */
  useLayoutEffect(() => {
    if (loading || !spot?.id) return;
    const id = requestAnimationFrame(blurIfFocusOutsideScreenRoot);
    return () => cancelAnimationFrame(id);
  }, [loading, spot?.id, blurIfFocusOutsideScreenRoot]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsAuthenticated(!!user && !user.is_anonymous);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    // Evitar async dentro del callback (AbortError con navigator.locks/Supabase). Usar session síncrona.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setIsAuthenticated(!session.user.is_anonymous);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("spots")
        .select(
          "id, title, description_short, description_long, cover_image_url, latitude, longitude, address, mapbox_bbox, mapbox_feature_type",
        )
        .eq("id", id)
        .eq("is_hidden", false)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        setSpot(null);
        return;
      }
      const s = data as SpotEdit;
      setSpot(s);
      setTitle(s.title);
      setShortDesc(s.description_short ?? "");
      setLongDesc(s.description_long ?? "");
      setCoverImageUrl(s.cover_image_url);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!spot?.id) {
      setGalleryRows([]);
      return;
    }
    let cancelled = false;
    void listSpotImages(spot.id).then((rows) => {
      if (!cancelled) setGalleryRows(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [spot?.id]);

  const handleBack = useCallback(() => {
    if (returnTo === "explore" && id) {
      (router.replace as (href: string) => void)(getMapSpotDeepLink(id, "extended"));
      return;
    }
    router.back();
  }, [router, returnTo, id]);

  const handleAddOrChangeCover = useCallback(async () => {
    if (!spot?.id || !isAuthenticated) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
      return;
    }
    const sharePref = await resolvePhotoSharingOrAskOnce();
    if (sharePref == null) return;
    if (!sharePref) {
      toast.show("Tus fotos están en modo privado. Sube fotos desde galería (Subir mis fotos).", {
        type: "error",
      });
      return;
    }
    setCoverUploading(true);
    try {
      const files = await pickImageFilesFromWeb({ multiple: false });
      const file = files?.[0] ?? null;
      if (!file) return;
      const blob = file;
      const optimized = await optimizeSpotImage(blob);
      const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
      if (!toUpload) {
        toast.show("No se pudo preparar la imagen. Inténtalo de nuevo.", { type: "error" });
        return;
      }
      const url = await uploadSpotCover(spot.id, toUpload);
      if (!url) {
        toast.show("No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.", {
          type: "error",
        });
        return;
      }
      const { error } = await supabase
        .from("spots")
        .update({ cover_image_url: url })
        .eq("id", spot.id);
      if (error) {
        toast.show(error.message ?? "No se pudo guardar la foto. ¿Intentas de nuevo?", {
          type: "error",
        });
        return;
      }
      const displayUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      setCoverImageUrl(displayUrl);
    } catch {
      toast.show("No se pudo abrir el selector de imagen.", { type: "error" });
    } finally {
      setCoverUploading(false);
    }
  }, [spot?.id, isAuthenticated, openAuthModal, toast, resolvePhotoSharingOrAskOnce]);

  const handleRemoveCover = useCallback(async () => {
    if (!spot?.id || !isAuthenticated) return;
    setCoverUploading(true);
    try {
      const { error } = await supabase
        .from("spots")
        .update({ cover_image_url: null })
        .eq("id", spot.id);
      if (!error) setCoverImageUrl(null);
    } catch {
      toast.show("No se pudo quitar la foto. Inténtalo de nuevo.", { type: "error" });
    } finally {
      setCoverUploading(false);
    }
  }, [spot?.id, isAuthenticated, toast]);

  const handleAddGalleryPhoto = useCallback(async () => {
    if (!spot?.id || !isAuthenticated) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
      return;
    }
    const sharePref = await resolvePhotoSharingOrAskOnce();
    if (sharePref == null) return;
    setGalleryUploading(true);
    try {
      const currentCount = galleryRows.length;
      if (currentCount >= MAX_SPOT_GALLERY_IMAGES) {
        toast.show(`Máximo ${MAX_SPOT_GALLERY_IMAGES} fotos`, {
          type: "error",
        });
        return;
      }
      const remainingSlots = MAX_SPOT_GALLERY_IMAGES - currentCount;
      const files = await pickImageFilesFromWeb({ multiple: true });
      if (!files || files.length === 0) return;

      const picked = files.slice(0, remainingSlots);
      let added = 0;
      let hitLimit = false;
      if (sharePref) {
        // Semilla (si aplica) después de la selección, pero antes de subir.
        await ensureGallerySeedFromCover(spot.id, coverImageUrl);
        const currentRows = await listSpotImages(spot.id);
        setGalleryRows(currentRows);
        for (const asset of picked) {
          const blob = asset;
          const optimized = await optimizeSpotImage(blob);
          const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
          if (!toUpload) continue;

          const url = await uploadSpotGalleryImage(spot.id, toUpload);
          if (!url) continue;
          const { row, error } = await addSpotImageRow(spot.id, url);
          if (error === "limit") {
            hitLimit = true;
            toast.show(`Máximo ${MAX_SPOT_GALLERY_IMAGES} fotos`, {
              type: "error",
            });
            break;
          }
          if (error === "db" || !row) continue;
          added += 1;
        }
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || user.is_anonymous) return;
        for (const asset of picked) {
          const blob = asset;
          const optimized = await optimizeSpotImage(blob);
          const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
          if (!toUpload) continue;
          const uploaded = await uploadSpotPersonalGalleryImage(spot.id, toUpload);
          if (!uploaded) continue;
          const { error } = await addSpotPersonalImageRow({
            spotId: spot.id,
            userId: user.id,
            storagePath: uploaded.storagePath,
          });
          if (error === "limit") {
            hitLimit = true;
            toast.show(`Máximo ${MAX_SPOT_GALLERY_IMAGES} fotos`, { type: "error" });
            break;
          }
          if (error === "db") continue;
          added += 1;
        }
      }

      if (added > 0) {
        if (sharePref) {
          await syncCoverFromGallery(spot.id);
          const rows = await listSpotImages(spot.id);
          setGalleryRows(rows);
          const first = rows[0] ? getSpotImagePublicUrl(rows[0]) : null;
          setCoverImageUrl(first ? `${first}${first.includes("?") ? "&" : "?"}t=${Date.now()}` : null);
        } else {
          const rows = await listSpotPersonalImages(spot.id);
          const signed = (
            await Promise.all(rows.map((r) => createSpotPersonalImageSignedUrl(r.storage_path)))
          ).filter((u): u is string => Boolean(u));
          // No mezclar modelos: en modo privado, mostramos "cover" como primera firmada para que el bloque no quede vacío.
          const first = signed[0] ?? null;
          setCoverImageUrl(first ? `${first}${first.includes("?") ? "&" : "?"}t=${Date.now()}` : null);
          setGalleryRows([]);
        }
        toast.show(added === 1 ? "Foto añadida" : `${added} fotos añadidas`, { type: "success" });
      } else if (!hitLimit && picked.length > 0) {
        toast.show("No se pudo subir ninguna foto. Inténtalo de nuevo.", {
          type: "error",
        });
      }
    } catch {
      toast.show("No se pudo añadir la foto.", { type: "error" });
    } finally {
      setGalleryUploading(false);
    }
  }, [spot, isAuthenticated, openAuthModal, toast, coverImageUrl, galleryRows.length, resolvePhotoSharingOrAskOnce]);

  const handleRemoveGalleryImage = useCallback(
    async (imageId: string) => {
      if (!spot?.id || !isAuthenticated) {
        openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
        return;
      }
      try {
        // Si ya está en proceso, no hacer nada.
        if (deletingImageIds.has(imageId)) return;
        setDeletingImageIds((prev) => {
          const next = new Set(prev);
          next.add(imageId);
          return next;
        });

        // Optimista: quitar de UI primero (para que no parezca “lento”).
        const prevRows = galleryRows;
        const nextRowsOptimistic = prevRows.filter((r) => r.id !== imageId);
        setGalleryRows(nextRowsOptimistic);
        // Mantener cover y layout consistentes: la portada efectiva es siempre la primera de la galería.
        // Si al borrar queda vacío, ocultar portada inmediatamente (evita que “permanezca” una foto).
        const nextFirst = nextRowsOptimistic[0] ? getSpotImagePublicUrl(nextRowsOptimistic[0]) : null;
        setCoverImageUrl(
          nextFirst
            ? `${nextFirst}${nextFirst.includes("?") ? "&" : "?"}t=${Date.now()}`
            : null,
        );
        const ok = await removeSpotImage(imageId);
        if (!ok) {
          setGalleryRows(prevRows);
          const prevFirst = prevRows[0] ? getSpotImagePublicUrl(prevRows[0]) : null;
          setCoverImageUrl(
            prevFirst
              ? `${prevFirst}${prevFirst.includes("?") ? "&" : "?"}t=${Date.now()}`
              : null,
          );
          toast.show("No se pudo eliminar la foto.", { type: "error" });
          return;
        }
        // Serializar sync portada + refresh para evitar carreras si se borran varias rápido.
        void coverSyncQueueRef.current.enqueue(async () => {
          await syncCoverFromGallery(spot.id);
          const rows = await listSpotImages(spot.id);
          // Nunca re-mostrar imágenes que el usuario ya eliminó (optimista) pero aún están en vuelo.
          const visibleRows = rows.filter((r) => !deletingImageIdsRef.current.has(r.id));
          setGalleryRows(visibleRows);
          const first = visibleRows[0] ? getSpotImagePublicUrl(visibleRows[0]) : null;
          setCoverImageUrl(
            first ? `${first}${first.includes("?") ? "&" : "?"}t=${Date.now()}` : null,
          );
        });
        deleteGalleryToastRef.current.bump(1);
      } catch {
        toast.show("No se pudo eliminar la foto.", { type: "error" });
      } finally {
        setDeletingImageIds((prev) => {
          const next = new Set(prev);
          next.delete(imageId);
          return next;
        });
      }
    },
    [spot?.id, isAuthenticated, openAuthModal, toast, galleryRows, deletingImageIds],
  );

  const handleGallerySwapWithNeighbor = useCallback(
    async (index: number, delta: -1 | 1) => {
      if (!spot?.id || !isAuthenticated) return;
      const j = index + delta;
      if (j < 0 || j >= galleryRows.length) return;
      const next = [...galleryRows];
      [next[index], next[j]] = [next[j], next[index]];
      const newIds = next.map((r) => r.id);
      setGalleryUploading(true);
      try {
        const ok = await reorderSpotImages(spot.id, newIds);
        if (!ok) {
          toast.show("No se pudo reordenar.", { type: "error" });
          const rows = await listSpotImages(spot.id);
          setGalleryRows(rows);
          return;
        }
        await syncCoverFromGallery(spot.id);
        setGalleryRows(next);
        const first = next[0] ? getSpotImagePublicUrl(next[0]) : null;
        setCoverImageUrl(first ? `${first}${first.includes("?") ? "&" : "?"}t=${Date.now()}` : null);
      } catch {
        toast.show("No se pudo reordenar.", { type: "error" });
        const rows = await listSpotImages(spot.id);
        setGalleryRows(rows);
      } finally {
        setGalleryUploading(false);
      }
    },
    [spot?.id, isAuthenticated, galleryRows, toast],
  );

  const handleSave = useCallback(async () => {
    if (!spot?.id || !title.trim()) {
      toast.show("Necesitamos un título para el lugar", { type: "error" });
      return;
    }
    if (!isAuthenticated) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
      return;
    }
    setSaving(true);
    const updates: Record<string, unknown> = {
      title: title.trim(),
      description_short: shortDesc.trim() || null,
      description_long: longDesc.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (locationDraft) {
      updates.latitude = locationDraft.latitude;
      updates.longitude = locationDraft.longitude;
      updates.address = locationDraft.address;
      updates.mapbox_bbox = null;
      updates.mapbox_feature_type = null;
      const resolvedFraming = await resolveCameraFramingForPointName({
        name: title.trim(),
        lat: locationDraft.latitude,
        lng: locationDraft.longitude,
        selectedPlace: locationDraft.selectedPlace ?? null,
      });
      if (resolvedFraming.bbox) updates.mapbox_bbox = resolvedFraming.bbox;
      if (resolvedFraming.featureType != null && String(resolvedFraming.featureType).trim() !== "") {
        updates.mapbox_feature_type = resolvedFraming.featureType;
      }
      if (locationDraft.selectedPlace) {
        const p = locationDraft.selectedPlace;
        const stableId = getStablePlaceId(p);
        if (stableId) {
          updates.link_status = "linked";
          updates.linked_place_id = stableId;
          updates.linked_place_kind = inferTappedKindFromPlace(p);
          updates.linked_maki = p.maki ?? null;
          updates.linked_at = new Date().toISOString();
          updates.link_version = SPOT_LINK_VERSION;
          updates.link_score = 1;
        } else {
          updates.link_status = "unlinked";
          updates.linked_place_id = null;
          updates.linked_place_kind = null;
          updates.linked_maki = p.maki ?? null;
          updates.linked_at = null;
          updates.link_version = null;
          updates.link_score = null;
        }
      } else if (featureFlags.linkOnEditSave) {
        const link = await resolveSpotLink({
          title: title.trim(),
          lat: locationDraft.latitude,
          lng: locationDraft.longitude,
        });
        updates.link_status = link.linkStatus;
        updates.link_score = link.linkScore;
        updates.linked_place_id = link.linkedPlaceId;
        updates.linked_place_kind = link.linkedPlaceKind;
        updates.linked_maki = link.linkedMaki;
        updates.linked_at = link.linkedAt;
        updates.link_version = link.linkVersion;
      }
    } else if (!sanitizeCameraBBoxForPoint(spot.mapbox_bbox, { lat: spot.latitude, lng: spot.longitude })) {
      updates.mapbox_bbox = null;
      updates.mapbox_feature_type = null;
      const resolvedFraming = await resolveCameraFramingForPointName({
        name: title.trim(),
        lat: spot.latitude,
        lng: spot.longitude,
      });
      if (resolvedFraming.bbox) updates.mapbox_bbox = resolvedFraming.bbox;
      if (resolvedFraming.featureType != null && String(resolvedFraming.featureType).trim() !== "") {
        updates.mapbox_feature_type = resolvedFraming.featureType;
      }
    }
    const { error } = await supabase
      .from("spots")
      .update(updates)
      .eq("id", spot.id);
    setSaving(false);
    if (error) {
      toast.show(error.message ?? "No se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
      return;
    }
    await verifySpotInDb(spot.id, "save");
    toast.show("Cambios guardados correctamente", { type: "success" });
    (router.replace as (href: string) => void)(getMapSpotDeepLink(spot.id));
  }, [
    spot?.id,
    spot?.latitude,
    spot?.longitude,
    spot?.mapbox_bbox,
    title,
    shortDesc,
    longDesc,
    locationDraft,
    toast,
    openAuthModal,
    router,
    isAuthenticated,
  ]);

  /**
   * Soft delete: oculta el spot vía RPC hide_spot (SECURITY DEFINER).
   * Evita depender de políticas RLS UPDATE en spots; la función hace el UPDATE en el servidor.
   */
  const handleDeleteSpot = useCallback(async (): Promise<void> => {
    const spotId = spot?.id;
    if (!spotId) return;
    if (!isAuthenticated) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
      return;
    }
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u || u.is_anonymous) {
        openAuthModal({ message: AUTH_MODAL_MESSAGES.profile });
        return;
      }
    } catch {
      toast.show("No se pudo verificar la sesión. ¿Reintentamos?", { type: "error" });
      return;
    }

    const { data, error } = await supabase.rpc("hide_spot", { p_spot_id: spotId });

    if (error) {
      toast.show(error.message ?? "No se pudo eliminar. Prueba otra vez.", { type: "error" });
      return;
    }

    const row = data as { id?: string; is_hidden?: boolean; updated_at?: string } | null;
    if (!row || row.is_hidden !== true) {
      toast.show("El lugar no se marcó como eliminado. Prueba otra vez.", { type: "error" });
      return;
    }

    toast.show("Lugar eliminado. Ya no aparecerá en tu lista.", { type: "error" });
    (router.replace as (href: string) => void)("/(tabs)");
  }, [spot?.id, isAuthenticated, openAuthModal, toast, router]);

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando…
        </Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Lugar no encontrado
        </Text>
        <Pressable
          onPress={handleBack}
          style={[styles.backLink, { marginTop: Spacing.base }]}
        >
          <Text style={{ color: colors.primary }}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const lat = locationDraft?.latitude ?? spot.latitude;
  const lng = locationDraft?.longitude ?? spot.longitude;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        ref={screenRootRef}
        style={[
          styles.root,
          { backgroundColor: colors.background },
        ]}
      >
        <SharePhotosConsentModal
          visible={photoShareConsentOpen}
          busy={photoShareConsentBusy}
          onChoose={async (choice) => {
            const resolver = pendingPhotoShareResolverRef.current;
            pendingPhotoShareResolverRef.current = null;
            setPhotoShareConsentBusy(true);
            const { ok } = await persistMyPhotoSharingPreference(choice);
            setPhotoShareConsentBusy(false);
            setPhotoShareConsentOpen(false);
            resolver?.(ok ? choice : null);
            if (!ok) {
              toast.show("No se pudo guardar tu preferencia. Inténtalo de nuevo.", {
                type: "error",
              });
            }
          }}
          onCancel={() => {
            const resolver = pendingPhotoShareResolverRef.current;
            pendingPhotoShareResolverRef.current = null;
            setPhotoShareConsentOpen(false);
            resolver?.(null);
          }}
        />
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.borderSubtle,
              paddingTop: Platform.OS === "web" ? Spacing.md : 48,
            },
          ]}
        >
          <IconButton
            variant="default"
            onPress={handleBack}
            accessibilityLabel="Volver"
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </IconButton>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Editar lugar
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {!isAuthenticated ? (
          <View
            style={[
              styles.authBanner,
              {
                backgroundColor: colors.backgroundElevated,
                borderBottomColor: colors.borderSubtle,
              },
            ]}
          >
            <Text
              style={[styles.authBannerText, { color: colors.textSecondary }]}
            >
              Inicia sesión para editar este lugar
            </Text>
            <Pressable
              onPress={() =>
                openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot })
              }
              style={[styles.authBannerButton, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Iniciar sesión
              </Text>
            </Pressable>
          </View>
        ) : null}

        <KeyboardAvoidingView
          style={[
            styles.keyboardView,
            Platform.OS === "web" && styles.webMainColumn,
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Fotos
              </Text>
              <Text style={[styles.photoSubLabel, { color: colors.textSecondary }]}>
                Las fotos que subas aquí son públicas y todos los usuarios de FLOWYA podrán verlas.
              </Text>
              {coverImageUrl || galleryRows.length > 0 ? (
                <View style={styles.photoBlock}>
                  {galleryRows.length > 0 ? (
                    <>
                      <View
                        style={[styles.galleryGrid, { gap: galleryGap }]}
                        onLayout={(e) =>
                          setGalleryGridWidth(e.nativeEvent.layout.width)
                        }
                      >
                        {galleryRows.map((item, index) => (
                          <View
                            key={item.id}
                            style={[
                              styles.galleryCell,
                              { width: galleryThumbSize },
                            ]}
                          >
                            <View style={styles.galleryThumbWrap}>
                              <SpotImage
                                uri={item.url}
                                width={galleryThumbSize}
                                height={galleryThumbSize}
                                borderRadius={Radius.sm}
                                colorScheme={colorScheme ?? undefined}
                              />
                              {isAuthenticated ? (
                                <>
                                  <Pressable
                                    style={styles.galleryDeleteFab}
                                    onPress={() =>
                                      handleRemoveGalleryImage(item.id)
                                    }
                                    disabled={
                                      galleryUploading || deletingImageIds.has(item.id)
                                    }
                                    hitSlop={{
                                      top: 8,
                                      right: 8,
                                      bottom: 8,
                                      left: 8,
                                    }}
                                    accessibilityLabel="Eliminar foto"
                                  >
                                    <X size={16} color="#fff" strokeWidth={2.5} />
                                  </Pressable>
                                  {index > 0 ? (
                                    <Pressable
                                      style={styles.galleryReorderLeft}
                                      onPress={() =>
                                        handleGallerySwapWithNeighbor(index, -1)
                                      }
                                      disabled={galleryUploading}
                                      accessibilityLabel="Mover antes en la galería"
                                      accessibilityRole="button"
                                    >
                                      <ChevronLeft
                                        size={18}
                                        color="#fff"
                                        strokeWidth={2.5}
                                      />
                                    </Pressable>
                                  ) : null}
                                  {index < galleryRows.length - 1 ? (
                                    <Pressable
                                      style={styles.galleryReorderRight}
                                      onPress={() =>
                                        handleGallerySwapWithNeighbor(index, 1)
                                      }
                                      disabled={galleryUploading}
                                      accessibilityLabel="Mover después en la galería"
                                      accessibilityRole="button"
                                    >
                                      <ChevronRight
                                        size={18}
                                        color="#fff"
                                        strokeWidth={2.5}
                                      />
                                    </Pressable>
                                  ) : null}
                                </>
                              ) : null}
                            </View>
                          </View>
                        ))}
                        {isAuthenticated &&
                        galleryRows.length < MAX_SPOT_GALLERY_IMAGES ? (
                          <AddImageCta
                            onPress={handleAddGalleryPhoto}
                            busy={galleryUploading}
                            disabled={coverUploading || galleryUploading}
                            size="tile"
                            width={galleryThumbSize}
                            height={galleryThumbSize}
                            borderColor={colors.primary}
                            backgroundColor={colors.backgroundElevated}
                            accessibilityLabel="Añadir otra foto"
                            label="Subir mis fotos"
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.photoReorderHint,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Usa las flechas en la parte inferior de cada foto para
                        cambiar el orden.
                      </Text>
                      {isAuthenticated ? (
                        <Text
                          style={[styles.photoMeta, { color: colors.textSecondary }]}
                        >
                          {`${galleryRows.length} ${
                            galleryRows.length === 1 ? "foto" : "fotos"
                          } · máx. ${MAX_SPOT_GALLERY_IMAGES}`}
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <View style={styles.coverWrap}>
                        <Pressable
                          style={styles.coverTouch}
                          onPress={handleAddOrChangeCover}
                          disabled={
                            coverUploading || galleryUploading || !isAuthenticated
                          }
                          accessibilityLabel="Cambiar foto"
                          accessibilityHint="Sustituye la imagen principal"
                        >
                          {coverUploading ? (
                            <View
                              style={[
                                styles.coverOverlay,
                                { backgroundColor: colors.background },
                              ]}
                            >
                              <ActivityIndicator size="small" color={colors.text} />
                            </View>
                          ) : null}
                          <SpotImage
                            uri={coverImageUrl!}
                            height={140}
                            borderRadius={Radius.md}
                            colorScheme={colorScheme ?? undefined}
                          />
                        </Pressable>
                        {isAuthenticated ? (
                          <Pressable
                            style={[
                              styles.coverRemoveBtn,
                              { backgroundColor: colors.background },
                            ]}
                            onPress={handleRemoveCover}
                            disabled={coverUploading || galleryUploading}
                            accessibilityLabel="Quitar foto"
                          >
                            <X size={18} color={colors.text} strokeWidth={2.5} />
                          </Pressable>
                        ) : null}
                      </View>
                      {isAuthenticated ? (
                        <>
                          {galleryRows.length < MAX_SPOT_GALLERY_IMAGES ? (
                            <AddImageCta
                              onPress={handleAddGalleryPhoto}
                              busy={galleryUploading}
                              disabled={coverUploading || galleryUploading}
                              size="tile"
                              borderColor={colors.primary}
                              backgroundColor={colors.backgroundElevated}
                              accessibilityLabel="Añadir otra foto"
                              label="Subir mis fotos"
                            />
                          ) : null}
                          <Text
                            style={[styles.photoMeta, { color: colors.textSecondary }]}
                          >
                            {`1 foto · máx. ${MAX_SPOT_GALLERY_IMAGES}`}
                          </Text>
                        </>
                      ) : null}
                    </>
                  )}
                </View>
              ) : (
                <View
                  style={[
                    styles.coverPlaceholder,
                    {
                      borderColor: colors.borderSubtle,
                      opacity: isAuthenticated ? 1 : 0.6,
                    },
                  ]}
                >
                  <AddImageCta
                    onPress={handleAddGalleryPhoto}
                    busy={galleryUploading}
                    disabled={coverUploading || galleryUploading || !isAuthenticated}
                    size="media"
                    borderColor="transparent"
                    backgroundColor="transparent"
                    accessibilityLabel="Subir mis fotos"
                    label="Subir mis fotos"
                  />
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Título *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Nombre del lugar"
                placeholderTextColor={colors.textSecondary}
                editable={isAuthenticated}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Descripción corta
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  {
                    color: colors.text,
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                value={shortDesc}
                onChangeText={setShortDesc}
                placeholder="Breve descripción"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                editable={isAuthenticated}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Descripción larga
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  {
                    color: colors.text,
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                value={longDesc}
                onChangeText={setLongDesc}
                placeholder="Descripción detallada"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                editable={isAuthenticated}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Ubicación
              </Text>
              <View style={styles.mapSection}>
                <EditSpotMapSlot
                  latitude={lat}
                  longitude={lng}
                  onEditLocation={() => {
                    if (!isAuthenticated) {
                      openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
                      return;
                    }
                    blurActiveElement();
                    setShowLocationPicker(true);
                  }}
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: saving || !isAuthenticated ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={saving || !isAuthenticated}
              accessibilityLabel="Guardar"
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar</Text>
              )}
            </Pressable>

            {isAuthenticated ? (
              <Pressable
                style={({ pressed }) => [
                  styles.deleteBtn,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: pressed && !isDeleting
                      ? colors.backgroundElevated
                      : "transparent",
                    opacity: isDeleting ? 0.6 : 1,
                  },
                  WebTouchManipulation,
                ]}
                onPress={() => {
                  blurActiveElement();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                accessibilityLabel={
                  isDeleting ? "Eliminando…" : "Eliminar lugar"
                }
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.destructiveLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {isDeleting ? "Eliminando…" : "Eliminar lugar"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar este lugar?"
        message="Esta acción no se puede deshacer."
        confirmLabel={isDeleting ? "Eliminando…" : "Eliminar"}
        cancelLabel="Cancelar"
        variant="destructive"
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        onConfirm={async () => {
          toast.show("Eliminando…", { type: "default" });
          setIsDeleting(true);
          try {
            await handleDeleteSpot();
          } catch (e) {
            if (__DEV__) {
              console.warn("[soft-delete] onConfirm catch", e);
            }
            toast.show("No se pudo eliminar. Reintenta.", { type: "error" });
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
      />

      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View
          style={[
            styles.locationPickerModal,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.locationPickerHeader,
              {
                backgroundColor: colors.backgroundElevated,
                borderBottomColor: colors.borderSubtle,
                paddingTop: Platform.OS === "web" ? Spacing.md : 48,
              },
            ]}
          >
            <View style={styles.locationPickerTitleBlock}>
              <Text style={[styles.locationPickerTitle, { color: colors.text }]}>
                Selecciona la ubicación del lugar
              </Text>
              <Text style={[styles.locationPickerSubtitle, { color: colors.textSecondary }]}>
                Busca el lugar o mueve el pin en el mapa. Si eliges un resultado de la lista, la vista se
                ajusta mejor a ese lugar.
              </Text>
            </View>
            <Pressable
              style={styles.locationPickerCloseTouch}
              onPress={() => setShowLocationPicker(false)}
              hitSlop={12}
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <X size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.locationPickerContent}>
            <MapLocationPicker
              initialLatitude={lat}
              initialLongitude={lng}
              onConfirm={(result) => {
                setLocationDraft(result);
                setShowLocationPicker(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.base,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
  },
  backLink: {
    padding: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  authBanner: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  authBannerText: {
    fontSize: 15,
  },
  authBannerButton: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  keyboardView: {
    flex: 1,
    minHeight: 0,
  },
  webMainColumn: {
    alignSelf: "center",
    width: "100%",
    maxWidth: WEB_SHEET_MAX_WIDTH,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
    /** Las filas de formulario y la galería usan todo el ancho útil del panel. */
    alignItems: "stretch",
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  coverWrap: {
    position: "relative",
    width: "100%",
    alignSelf: "stretch",
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  coverTouch: {
    width: "100%",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
  },
  coverRemoveBtn: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholder: {
    width: "100%",
    alignSelf: "stretch",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.md,
    padding: Spacing.lg,
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  photoSubLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: Spacing.md,
  },
  photoReorderHint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: Spacing.sm,
  },
  photoBlock: {
    width: "100%",
    alignSelf: "stretch",
    gap: Spacing.md,
  },
  /** Celda “Añadir”: mismo aspecto que miniaturas; el tamaño en grid viene inline. */
  galleryAddTile: {
    minWidth: GALLERY_MIN_THUMB,
    minHeight: GALLERY_MIN_THUMB,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  galleryAddTileLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  photoMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  /** Grid responsivo: ancho completo del campo; celdas con `width` calculado en runtime. */
  galleryGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
  },
  galleryCell: {
    flexShrink: 0,
  },
  galleryThumbWrap: {
    position: "relative",
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  galleryDeleteFab: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryReorderLeft: {
    position: "absolute",
    left: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryReorderRight: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapSection: {
    height: MAP_SPOT_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
    height: MAP_SPOT_HEIGHT,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  editMapOverlay: {
    position: "absolute",
    left: MAP_CONTROLS_PADDING,
    right: MAP_CONTROLS_PADDING,
    bottom: MAP_CONTROLS_PADDING,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  editLocationButtonLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  mapPlaceholder: {
    flex: 1,
    width: "100%",
    height: MAP_SPOT_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    fontSize: 14,
  },
  saveBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  destructiveLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  locationPickerModal: {
    flex: 1,
  },
  locationPickerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  locationPickerTitleBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: Spacing.xs,
  },
  locationPickerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  locationPickerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  locationPickerCloseTouch: {
    padding: Spacing.sm,
  },
  locationPickerContent: {
    flex: 1,
  },
});
