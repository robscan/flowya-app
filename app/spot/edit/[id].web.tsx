import "@/styles/mapbox-attribution-overrides.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
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
import { useToast } from "@/components/ui/toast";
import {
  Colors,
  Radius,
  Spacing,
  WebTouchManipulation,
} from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getMapSpotDeepLink } from "@/lib/explore-deeplink";
import { optimizeSpotImage } from "@/lib/spot-image-optimize";
import { uploadSpotCover } from "@/lib/spot-image-upload";
import { supabase } from "@/lib/supabase";
import { ImagePlaceholder } from "@/components/design-system/image-placeholder";
import { SpotImage } from "@/components/design-system/spot-image";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_SPOT_HEIGHT = 320;
const MAP_CONTROLS_PADDING = 8;

type SpotEdit = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
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
  const [locationDraft, setLocationDraft] =
    useState<MapLocationPickerResult | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user && !user.is_anonymous);
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
          "id, title, description_short, description_long, cover_image_url, latitude, longitude, address",
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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAddOrChangeCover = useCallback(async () => {
    if (!spot?.id || !isAuthenticated) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.editSpot });
      return;
    }
    setCoverUploading(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });
      if (result.canceled || !result.assets[0]?.uri) {
        setCoverUploading(false);
        return;
      }
      const res = await fetch(result.assets[0].uri);
      if (!res.ok) {
        setCoverUploading(false);
        return;
      }
      const blob = await res.blob();
      const optimized = await optimizeSpotImage(blob);
      const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
      if (!toUpload) {
        setCoverUploading(false);
        return;
      }
      const url = await uploadSpotCover(spot.id, toUpload);
      if (url) {
        const { error } = await supabase
          .from("spots")
          .update({ cover_image_url: url })
          .eq("id", spot.id);
        if (!error) {
          const displayUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
          setCoverImageUrl(displayUrl);
        }
      }
    } catch {
      // Silencioso
    } finally {
      setCoverUploading(false);
    }
  }, [spot?.id, isAuthenticated, openAuthModal]);

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
      // Silencioso
    } finally {
      setCoverUploading(false);
    }
  }, [spot?.id, isAuthenticated]);

  const handleSave = useCallback(async () => {
    if (!spot?.id || !title.trim()) {
      toast.show("El título es obligatorio", { type: "error" });
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
    }
    const { error } = await supabase
      .from("spots")
      .update(updates)
      .eq("id", spot.id);
    setSaving(false);
    if (error) {
      toast.show(error.message ?? "No se pudo guardar", { type: "error" });
      return;
    }
    await verifySpotInDb(spot.id, "save");
    toast.show("Cambios guardados", { type: "success" });
    (router.replace as (href: string) => void)(getMapSpotDeepLink(spot.id));
  }, [
    spot?.id,
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
      toast.show("No se pudo verificar la sesión. Reintenta.", { type: "error" });
      return;
    }

    const { data, error } = await supabase.rpc("hide_spot", { p_spot_id: spotId });

    if (error) {
      toast.show(error.message ?? "No se pudo eliminar. Reintenta.", { type: "error" });
      return;
    }

    const row = data as { id?: string; is_hidden?: boolean; updated_at?: string } | null;
    if (!row || row.is_hidden !== true) {
      toast.show("El spot no se marcó como eliminado. Reintenta.", { type: "error" });
      return;
    }

    toast.show("Spot eliminado", { type: "success" });
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
          Spot no encontrado
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
        style={[
          styles.root,
          { backgroundColor: colors.background },
        ]}
      >
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
            Editar spot
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
              Inicia sesión para editar este spot
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
          style={styles.keyboardView}
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
                Foto de portada
              </Text>
              {coverImageUrl ? (
                <View style={styles.coverWrap}>
                  <Pressable
                    style={styles.coverTouch}
                    onPress={handleAddOrChangeCover}
                    disabled={coverUploading || !isAuthenticated}
                    accessibilityLabel="Cambiar foto"
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
                      uri={coverImageUrl}
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
                      disabled={coverUploading}
                      accessibilityLabel="Quitar foto"
                    >
                      <X size={18} color={colors.text} strokeWidth={2.5} />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <Pressable
                  style={[
                    styles.coverPlaceholder,
                    {
                      borderColor: colors.borderSubtle,
                      opacity: isAuthenticated ? 1 : 0.6,
                    },
                  ]}
                  onPress={handleAddOrChangeCover}
                  disabled={coverUploading || !isAuthenticated}
                  accessibilityLabel="Agregar foto"
                >
                  {coverUploading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.textSecondary}
                    />
                  ) : (
                    <>
                      <ImagePlaceholder
                        width={200}
                        height={100}
                        borderRadius={Radius.md}
                        colorScheme={colorScheme ?? undefined}
                        iconSize={24}
                      />
                      <Text
                        style={[
                          styles.coverPlaceholderLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Agregar foto
                      </Text>
                    </>
                  )}
                </Pressable>
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
                onPress={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                accessibilityLabel={
                  isDeleting ? "Eliminando…" : "Eliminar spot"
                }
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.destructiveLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {isDeleting ? "Eliminando…" : "Eliminar Spot"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar este spot?"
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
            <Text style={[styles.locationPickerTitle, { color: colors.text }]}>
              Selecciona la ubicación del spot
            </Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
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
    maxWidth: 320,
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
    width: 200,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.md,
    padding: Spacing.lg,
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderLabel: {
    fontSize: 15,
    marginTop: Spacing.xs,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  locationPickerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  locationPickerCloseTouch: {
    padding: Spacing.sm,
  },
  locationPickerContent: {
    flex: 1,
  },
});
