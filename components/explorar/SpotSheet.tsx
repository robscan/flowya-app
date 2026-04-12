/**
 * SpotSheet — Sheet inferior estilo Apple Maps (Explorar vNext).
 * 3 estados: PEEK (solo header), MEDIUM (header + resumen), EXPANDED (header + resumen con más espacio).
 * Drag + snap según docs/contracts/MOTION_SHEET.md (translateY, anchors, 25% + velocity).
 *
 * Modelo de intención (OL-WOW-F2-004): peek=awareness, medium=decision, expanded=detail.
 * CTA principal (Ver detalle, Por visitar, Crear spot) visible en medium sin scroll obligatorio.
 *
 * CONTRATOS (EXPLORE_SHEET, MOTION_SHEET):
 * - X dismiss: onClose llamado al tap X (parent setSelectedSpot(null) → unmount)
 * - map->peek: parent useMapCore onUserMapGestureStart → setSheetState("peek")
 * - drag 3 estados: Pan gesture en handle/header → peek ↔ medium ↔ expanded
 * - scroll único: un solo ScrollView en body (solo en expanded si hace falta); en **medium** el cuerpo no hace scroll — el sheet crece con el contenido (EXPLORE_SHEET medium sin scroll fantasma).
 */

import { ImagePlaceholder } from "@/components/design-system/image-placeholder";
import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { SpotImageGrid } from "@/components/design-system/spot-image-grid";
import { SpotImage } from "@/components/design-system/spot-image";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { SpotSheetHeader } from "@/components/explorar/spot-sheet/SpotSheetHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    distanceKm,
    formatDistanceKm,
    getMapsDirectionsUrl,
} from "@/lib/geo-utils";
import type { SpotHeroImagePressHandler } from "@/lib/spot-hero-press";
import {
    CheckCircle,
    Hash,
    MapPin,
    Pencil,
    Pin,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
    ActivityIndicator,
    Dimensions,
    type LayoutChangeEvent,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
  WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  WEB_SHEET_MAX_WIDTH,
  webSearchUsesConstrainedPanelWidth,
} from "@/lib/web-layout";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  getSheetHeightForState,
  resolveNextSheetStateFromGesture,
} from "@/components/explorar/spot-sheet/sheet-logic";

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(m.matches);
    const listener = () => setPrefers(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);
  return prefers;
}

/** Altura del sheet en PEEK (handle + header). */
export const SHEET_PEEK_HEIGHT = 96;
/** Altura máxima del body en MEDIUM antes de scroll (también acotada por viewport). */
export const SHEET_MEDIUM_MAX_BODY = 280;
/** Altura máxima del body en EXPANDED antes de scroll (también acotada por viewport). */
export const SHEET_EXPANDED_MAX_BODY = 420;
/** Mínimo de píxeles de mapa visibles arriba del sheet (para calcular tope desde viewport). */
const MIN_MAP_VISIBLE_TOP = 100;
/** Valores por defecto para overlay cuando no hay medición aún. */
export const SHEET_MEDIUM_HEIGHT = SHEET_PEEK_HEIGHT + 140;
export const SHEET_EXPANDED_HEIGHT = SHEET_PEEK_HEIGHT + 320;

/** @deprecated Usar SHEET_PEEK_HEIGHT. */
export const SHEET_COLLAPSED_HEIGHT = SHEET_PEEK_HEIGHT;
export const SHEET_SUMMARY_HEIGHT = SHEET_MEDIUM_HEIGHT;
export const COLLAPSED_HEIGHT_VISIBLE = SHEET_PEEK_HEIGHT;
export const EXPANDED_HEIGHT_VISIBLE = SHEET_EXPANDED_HEIGHT;
export const MAX_SHEET_HEIGHT = SHEET_EXPANDED_HEIGHT;

const COVER_HEIGHT = 100;
/** Panel lateral web: hero con más aire en columna estrecha (solo `webDesktopSidebar`). */
const COVER_HEIGHT_WEB_SIDEBAR = 200;
/** Sheet móvil (no sidebar): tope bajo del hero (portada o galería). */
const COVER_HEIGHT_GALLERY_MOBILE = 180;
const COVER_HEIGHT_GALLERY_MAX_MOBILE = 220;
/** Tope dinámico: el hero móvil no supera este % del alto de ventana. */
const GALLERY_HERO_MAX_VIEWPORT_RATIO = 0.3;
const HEADER_BUTTON_SIZE = 40;
const ACTION_PILL_HEIGHT = 46;
const ACTION_PILL_GAP = 12;
const ACTION_ICON_SIZE = 20;
const BODY_ROW_GAP = 14;
const ACTIVE_STATE_TO_VISIT = Colors.dark.stateToVisit;
const ACTIVE_STATE_VISITED = Colors.dark.stateSuccess;
const ACTIVE_STATE_FOREGROUND = Colors.light.text;

/** Anchors para drag/snap (MOTION_SHEET): collapsed px, medium/expanded % viewport. */
const ANCHOR_COLLAPSED_PX = SHEET_PEEK_HEIGHT;
const ANCHOR_MEDIUM_RATIO = 0.6;
const ANCHOR_EXPANDED_RATIO = 0.9;
/** Duraciones (ms): collapsed↔medium 280, medium↔expanded 320, programático 300. */
const DURATION_COLLAPSED_MEDIUM = 280;
const DURATION_MEDIUM_EXPANDED = 320;
const DURATION_PROGRAMMATIC = 300;
const EASING_SHEET = Easing.bezier(0.4, 0, 0.2, 1);
/** Umbral velocity (px/s) para snap por gesto: si |velocityY| > este valor, snap en esa dirección. */
const VELOCITY_SNAP_THRESHOLD = 400;
const SNAP_POSITION_THRESHOLD = 0.25;

export type SpotSheetSpot = {
  id: string;
  title: string;
  description_short?: string | null;
  description_long?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  saved?: boolean;
  visited?: boolean;
  /** Por qué importa (opcional). */
  why?: string | null;
  /** @deprecated Usar saved/visited. */
  pinStatus?: SpotPinStatus;
};

export type SheetState = "peek" | "medium" | "expanded";

export type SpotSheetProps = {
  spot: SpotSheetSpot | null;
  onClose: () => void;
  onOpenDetail: () => void;
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  onShare?: () => void;
  onSavePin?: (
    targetStatus?:
      | "to_visit"
      | "visited"
      | "clear_to_visit"
      | "clear_visited"
  ) => void;
  userCoords?: { latitude: number; longitude: number } | null;
  isAuthUser?: boolean;
  onDirections?: (spot: SpotSheetSpot) => void;
  onEdit?: (spotId: string) => void;
  /** Para draft (id startsWith 'draft_'): navegar a flujo de edición/creación (ej. /create-spot con params). */
  onEditDraft?: (spot: SpotSheetSpot) => void;
  /** Se llama cuando la altura del sheet cambia (para offset de controles). */
  onSheetHeightChange?: (height: number) => void;
  /** Modo "Ajustar ubicación": draft recién creado; mostrar Confirmar ubicación / Cancelar. */
  isPlacingDraftSpot?: boolean;
  /** Al confirmar ubicación del draft (sale del modo placing). */
  onConfirmPlacement?: () => void;
  /** Volver a modo colocar pin (solo BORRADOR confirmado). */
  onDraftBackToPlacing?: () => void;
  /** URI local de la imagen cover del draft (1 sola). */
  draftCoverUri?: string | null;
  /** Al elegir o quitar imagen cover del draft. */
  onDraftCoverChange?: (uri: string | null) => void;
  /** CTA "Crear spot" del BORRADOR: crear spot mínimo y abrir sheet EXTENDED. */
  onCreateSpot?: () => void;
  /** Modo POI no agregado: mismo sheet, animación y gestos. Sustituye POISheetMedium. */
  poi?: { name: string; lat: number; lng: number } | null;
  /** Filtro activo (Todos/Por visitar/Visitados) para CTA contextual. */
  pinFilter?: "all" | "saved" | "visited";
  onPoiPorVisitar?: () => void | Promise<void>;
  onPoiVisitado?: () => void | Promise<void>;
  onPoiShare?: () => void | Promise<void>;
  poiLoading?: boolean;
  /** Override del título mostrado (p. ej. nombre resuelto desde tiles del mapa). */
  displayTitleOverride?: string | null;
  /** Al tocar imagen del hero (portada o galería): lightbox con contexto completo. */
  onImagePress?: SpotHeroImagePressHandler;
  /** URLs del hero en orden (galería + portada); si no se pasa, solo `spot.cover_image_url`. */
  heroImageUris?: string[];
  /** Etiquetas del spot en el sheet (solo lectura). */
  sheetTagChips?: { id: string; label: string }[];
  /** Tap en chip: buscador en Por visitar o Visitados con filtro por esa etiqueta. */
  onSheetTagChipPress?: (tagId: string) => void;
  /** Abrir modal de etiquetar (mismo flujo que en listados). */
  onSheetEtiquetarPress?: () => void;
  /** Web ≥1080: panel en columna izquierda (paridad CountriesSheet / EXPLORE_CHROME_SHELL §8b). */
  webDesktopSidebar?: boolean;
  /** Qué pill está persistiendo (`saved` = Por visitar, `visited` = Visitado); solo esa muestra cargando. */
  pinMutationTarget?: null | "saved" | "visited";
};

type BodyContentProps = {
  spot: SpotSheetSpot;
  hasDesc: boolean;
  hasCover: boolean;
  isSaved: boolean;
  isVisited: boolean;
  distanceKmVal: number | null;
  whyText: string | null;
  addressText: string | null;
  isAuthUser?: boolean;
  colors: (typeof Colors)["light"];
  colorScheme: "light" | "dark" | null;
  onOpenDetail: () => void;
  handleSavePin: (
    targetStatus?:
      | "to_visit"
      | "visited"
      | "clear_to_visit"
      | "clear_visited"
  ) => void;
  handleDirections: () => void;
  handleEdit: () => void;
  onEdit?: (spotId: string) => void;
  sheetTagChips?: { id: string; label: string }[];
  onSheetTagChipPress?: (tagId: string) => void;
  onSheetEtiquetarPress?: () => void;
};

/** Distancia + chips de etiqueta + Etiquetar (medium y expanded). */
function SpotSheetMetaRow({
  distanceKmVal,
  tagChips,
  onTagChipPress,
  onEtiquetar,
  colors,
}: {
  distanceKmVal: number | null;
  tagChips: { id: string; label: string }[];
  onTagChipPress?: (tagId: string) => void;
  onEtiquetar?: () => void;
  colors: (typeof Colors)["light"];
}) {
  const showDistance = distanceKmVal != null;
  const showTags = tagChips.length > 0;
  const showEtiquetar = onEtiquetar != null;
  if (!showDistance && !showTags && !showEtiquetar) return null;
  return (
    <View style={styles.metaRow}>
      {showDistance ? (
        <Text style={[styles.metaDistance, { color: colors.textSecondary }]} accessibilityRole="text">
          A {formatDistanceKm(distanceKmVal!)}
        </Text>
      ) : null}
      {showTags || showEtiquetar ? (
        <View style={styles.metaChipsCluster}>
          {tagChips.map((chip) => (
            <Pressable
              key={chip.id}
              onPress={() => onTagChipPress?.(chip.id)}
              disabled={!onTagChipPress}
              style={[styles.metaTagChip, { backgroundColor: colors.borderSubtle }]}
              accessibilityLabel={`Buscar en el mapa con etiqueta ${chip.label}`}
              accessibilityRole="button"
            >
              <Text style={[styles.metaTagChipLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                #{chip.label}
              </Text>
            </Pressable>
          ))}
          {showEtiquetar ? (
            <Pressable
              onPress={onEtiquetar}
              style={styles.metaEtiquetar}
              accessibilityLabel="Etiquetar este lugar"
              accessibilityRole="button"
            >
              <Hash size={13} color={colors.primary} strokeWidth={2.2} />
              <Text style={[styles.metaEtiquetarLabel, { color: colors.primary }]}>Etiquetar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Solo lo que se muestra en MEDIUM: descripción corta + imagen + Guardar/Visitado (ocultos para draft). Sin navegación a detalle. */
function MediumBodyContent({
  spot,
  hasDesc,
  hasCover,
  isSaved,
  isVisited,
  isDraft,
  colors,
  colorScheme,
  handleSavePin,
  onImagePress,
  distanceKmVal,
  sheetTagChips,
  onSheetTagChipPress,
  onSheetEtiquetarPress,
  isAuthUser,
  coverHeight = COVER_HEIGHT,
  heroImageUris,
  webDesktopSidebar = false,
  pinMutationTarget = null,
}: Pick<
  BodyContentProps,
  | "spot"
  | "hasDesc"
  | "hasCover"
  | "isSaved"
  | "isVisited"
  | "colors"
  | "colorScheme"
  | "handleSavePin"
> & {
  isDraft?: boolean;
  pinMutationTarget?: null | "saved" | "visited";
  onImagePress?: SpotHeroImagePressHandler;
  distanceKmVal: number | null;
  sheetTagChips?: { id: string; label: string }[];
  onSheetTagChipPress?: (tagId: string) => void;
  onSheetEtiquetarPress?: () => void;
  isAuthUser?: boolean;
  /** Por defecto `COVER_HEIGHT`; en sidebar web el padre suele pasar `COVER_HEIGHT_WEB_SIDEBAR`. */
  coverHeight?: number;
  /** Lista canónica de URLs del hero (galería o [portada]). */
  heroImageUris?: string[];
  /** Columna lateral desktop: hero con `coverHeight` único (sin subir grid aparte). */
  webDesktopSidebar?: boolean;
}) {
  const effectiveUris =
    heroImageUris != null && heroImageUris.length > 0
      ? heroImageUris
      : spot.cover_image_url
        ? [spot.cover_image_url]
        : [];
  const showGrid = effectiveUris.length > 1;

  const { height: windowHeight } = useWindowDimensions();
  /**
   * Sidebar desktop: `coverHeight` del padre (p. ej. `COVER_HEIGHT_WEB_SIDEBAR`).
   * Móvil: techo adaptativo; no usa `coverHeight` (ver rama inferior).
   */
  const resolvedHeroHeight = useMemo(() => {
    if (webDesktopSidebar) return coverHeight;
    const dim = Dimensions.get("window");
    const winH =
      windowHeight > 0 ? windowHeight : dim.height > 0 ? dim.height : 640;
    const byViewport = Math.round(winH * GALLERY_HERO_MAX_VIEWPORT_RATIO);
    return Math.min(
      COVER_HEIGHT_GALLERY_MOBILE,
      COVER_HEIGHT_GALLERY_MAX_MOBILE,
      byViewport,
    );
  }, [webDesktopSidebar, coverHeight, windowHeight]);

  const savingPorVisitar = pinMutationTarget === "saved";
  const savingVisitado = pinMutationTarget === "visited";
  const pinMutationBusy = pinMutationTarget != null;

  return (
    <>
      {hasDesc ? (
        <View style={styles.descriptionWrap}>
          <Text
            style={[styles.description, { color: colors.textSecondary }]}
            numberOfLines={3}
          >
            {spot.description_short!.trim()}
          </Text>
        </View>
      ) : null}
      {hasCover ? (
        <View style={styles.imageRow}>
          <View style={[styles.imageWrap, { height: resolvedHeroHeight }]}>
            {showGrid ? (
              <SpotImageGrid
                uris={effectiveUris}
                totalHeight={resolvedHeroHeight}
                onImagePress={(index) =>
                  onImagePress?.({
                    uri: effectiveUris[index]!,
                    allUris: effectiveUris,
                    index,
                  })
                }
              />
            ) : effectiveUris[0] ? (
              onImagePress ? (
                <Pressable
                  onPress={() =>
                    onImagePress({
                      uri: effectiveUris[0]!,
                      allUris: effectiveUris,
                      index: 0,
                    })
                  }
                  accessibilityLabel="Ver imagen en pantalla completa"
                  accessibilityRole="button"
                >
                  <SpotImage
                    uri={effectiveUris[0]}
                    height={resolvedHeroHeight}
                    borderRadius={Radius.md}
                    colorScheme={colorScheme ?? undefined}
                  />
                </Pressable>
              ) : (
                <SpotImage
                  uri={effectiveUris[0]}
                  height={resolvedHeroHeight}
                  borderRadius={Radius.md}
                  colorScheme={colorScheme ?? undefined}
                />
              )
            ) : null}
          </View>
        </View>
      ) : null}
      {!isDraft ? (
        <View
          style={styles.actionRow}
          pointerEvents={pinMutationBusy ? "none" : "auto"} // sin disabled en pills: evita atenuado del estado optimista
        >
          <Pressable
            style={[
              styles.actionPill,
              {
                backgroundColor: isSaved
                  ? ACTIVE_STATE_TO_VISIT
                  : colors.backgroundElevated,
                borderColor: colors.borderSubtle,
                borderWidth: isSaved ? 0 : 1,
              },
            ]}
            onPress={() => handleSavePin(isSaved ? "clear_to_visit" : "to_visit")}
            accessibilityLabel={isSaved ? "Quitar Por visitar" : "Agregar a Por visitar"}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved, busy: savingPorVisitar }}
          >
            {savingPorVisitar ? (
              <ActivityIndicator
                size="small"
                color={isSaved ? ACTIVE_STATE_FOREGROUND : colors.primary}
              />
            ) : (
              <Pin
                size={ACTION_ICON_SIZE}
                color={isSaved ? ACTIVE_STATE_FOREGROUND : colors.text}
                strokeWidth={2}
              />
            )}
            <Text
              style={[
                styles.actionPillText,
                { color: isSaved ? ACTIVE_STATE_FOREGROUND : colors.text },
              ]}
              numberOfLines={1}
            >
              {isSaved ? "Por visitar ×" : "Por visitar"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionPill,
              {
                backgroundColor: isVisited
                  ? ACTIVE_STATE_VISITED
                  : colors.backgroundElevated,
                borderColor: colors.borderSubtle,
                borderWidth: isVisited ? 0 : 1,
              },
            ]}
            onPress={() => handleSavePin(isVisited ? "clear_visited" : "visited")}
            accessibilityLabel={isVisited ? "Quitar Visitado" : "Marcar Visitado"}
            accessibilityRole="button"
            accessibilityState={{ selected: isVisited, busy: savingVisitado }}
          >
            {savingVisitado ? (
              <ActivityIndicator
                size="small"
                color={isVisited ? ACTIVE_STATE_FOREGROUND : colors.primary}
              />
            ) : (
              <CheckCircle
                size={ACTION_ICON_SIZE}
                color={isVisited ? ACTIVE_STATE_FOREGROUND : colors.text}
                strokeWidth={2}
              />
            )}
            <Text
              style={[
                styles.actionPillText,
                { color: isVisited ? ACTIVE_STATE_FOREGROUND : colors.text },
              ]}
              numberOfLines={1}
            >
              {isVisited ? "Visitado ×" : "Visitado"}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {!isDraft &&
      (distanceKmVal != null ||
        (sheetTagChips?.length ?? 0) > 0 ||
        (isAuthUser && onSheetEtiquetarPress)) ? (
        <SpotSheetMetaRow
          distanceKmVal={distanceKmVal}
          tagChips={sheetTagChips ?? []}
          onTagChipPress={onSheetTagChipPress}
          onEtiquetar={onSheetEtiquetarPress}
          colors={colors}
        />
      ) : null}
    </>
  );
}

/** Contenido extra solo en EXPANDED: Por qué importa, dirección, Cómo llegar, Editar (distancia y etiquetas van en MediumBodyContent). */
function ExpandedExtra({
  whyText,
  addressText,
  isAuthUser,
  colors,
  handleDirections,
  handleEdit,
  onEdit,
}: Pick<
  BodyContentProps,
  | "whyText"
  | "addressText"
  | "isAuthUser"
  | "colors"
  | "handleDirections"
  | "handleEdit"
  | "onEdit"
>) {
  return (
    <>
      {whyText ? (
        <View style={styles.detailBlock}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
            Por qué importa
          </Text>
          <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
            {whyText}
          </Text>
        </View>
      ) : null}
      {addressText ? (
        <View style={styles.detailBlock}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
            Dirección
          </Text>
          <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
            {addressText}
          </Text>
        </View>
      ) : null}
      <Pressable
        style={[styles.detailButton, { backgroundColor: colors.tint }]}
        onPress={handleDirections}
        accessibilityLabel="Cómo llegar"
        accessibilityRole="button"
      >
        <MapPin size={20} color="#fff" strokeWidth={2} />
        <Text style={styles.detailButtonText}>Cómo llegar</Text>
      </Pressable>
      {isAuthUser && onEdit ? (
        <Pressable
          style={[
            styles.detailButton,
            { borderColor: colors.borderSubtle, borderWidth: 1 },
          ]}
          onPress={handleEdit}
          accessibilityLabel="Editar detalles"
          accessibilityRole="button"
        >
          <Pencil size={20} color={colors.text} strokeWidth={2} />
          <Text
            style={[styles.detailButtonTextSecondary, { color: colors.text }]}
          >
            Editar detalles
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

/** Estilos alineados con create-spot "Foto de portada" (celda canónica). */
const DRAFT_COVER_ADD_MIN_HEIGHT = 100 + 28; // 128, mismo que coverAddWrapLarge
/** Altura aproximada del body draft (DraftInlineEditor: label + add cell + botón) para anchor adaptativo. */
const DRAFT_BODY_HEIGHT_ESTIMATE = 260;

/** BORRADOR confirmado: Imagen (opcional) + CTA Crear spot. Sin campos de texto. Celda canónica = create-spot. */
function DraftInlineEditor({
  draftCoverUri,
  onDraftCoverChange,
  onCreateSpot,
  colors,
  colorScheme,
}: {
  draftCoverUri?: string | null;
  onDraftCoverChange?: (uri: string | null) => void;
  onCreateSpot?: () => void;
  colors: (typeof Colors)["light"];
  colorScheme: "light" | "dark" | null;
}) {
  const handleAddImage = useCallback(async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        onDraftCoverChange?.(result.assets[0].uri);
      }
    } catch {
      // Fallback silencioso
    }
  }, [onDraftCoverChange]);

  return (
    <View style={styles.draftActionsWrap}>
      <Text
        style={[styles.draftCoverLabel, { color: colors.textSecondary }]}
      >
        Imagen (opcional)
      </Text>
      {draftCoverUri ? (
        <View style={styles.draftCoverPreviewWrap}>
          <View style={styles.draftCoverPreviewInner}>
            <SpotImage
              uri={draftCoverUri}
              borderRadius={Radius.md}
              colorScheme={colorScheme ?? undefined}
            />
          </View>
          <Pressable
            style={[styles.draftCoverRemoveBtn, { backgroundColor: colors.borderSubtle }]}
            onPress={() => onDraftCoverChange?.(null)}
            accessibilityLabel="Quitar foto"
            accessibilityRole="button"
          >
            <Text style={[styles.draftCoverRemoveLabel, { color: colors.text }]}>
              Quitar
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[
            styles.draftCoverAddCell,
            { borderColor: colors.borderSubtle },
          ]}
          onPress={handleAddImage}
          accessibilityLabel="Agregar imagen"
          accessibilityRole="button"
        >
          <ImagePlaceholder
            width={200}
            height={100}
            borderRadius={Radius.md}
            colorScheme={colorScheme ?? undefined}
            iconSize={32}
          />
          <Text style={[styles.draftCoverAddLabel, { color: colors.textSecondary }]}>
            Agregar imagen
          </Text>
        </Pressable>
      )}
      {onCreateSpot ? (
        <Pressable
          style={[styles.detailButton, { backgroundColor: colors.tint }]}
          onPress={onCreateSpot}
          accessibilityLabel="Crear lugar"
          accessibilityRole="button"
        >
          <Text style={styles.detailButtonText}>Crear lugar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Modo POI no agregado: botón(es) contextual según pinFilter (Por visitar / Visitado). */
function PoiBodyContent({
  onPorVisitar,
  onVisitado,
  pinFilter = "all",
  loading,
  colors,
}: {
  onPorVisitar: () => void | Promise<void>;
  onVisitado?: () => void | Promise<void>;
  pinFilter?: "all" | "saved" | "visited";
  loading: boolean;
  colors: (typeof Colors)["light"];
}) {
  if (loading) {
    return (
      <View style={[styles.poiLoadingWrap, { marginTop: Spacing.md }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.poiLoadingText, { color: colors.textSecondary }]}>
          Guardando lugar…
        </Text>
      </View>
    );
  }
  const showPorVisitar = pinFilter === "saved" || pinFilter === "all";
  const showVisitado =
    (pinFilter === "all" || pinFilter === "visited") && onVisitado;

  return (
    <View style={[styles.actionRow, { marginTop: Spacing.md }]}>
      {showPorVisitar && (
        <Pressable
          style={[
            styles.actionPill,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              borderWidth: 1,
            },
          ]}
          onPress={onPorVisitar}
          accessibilityLabel="Por visitar"
          accessibilityRole="button"
          accessibilityState={{ selected: false }}
        >
          <Pin size={ACTION_ICON_SIZE} color={colors.text} strokeWidth={2} />
          <Text style={[styles.actionPillText, { color: colors.text }]} numberOfLines={1}>
            Por visitar
          </Text>
        </Pressable>
      )}
      {showVisitado && (
        <Pressable
          style={[
            styles.actionPill,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              borderWidth: 1,
            },
          ]}
          onPress={onVisitado}
          accessibilityLabel="Visitado"
          accessibilityRole="button"
          accessibilityState={{ selected: false }}
        >
          <CheckCircle size={ACTION_ICON_SIZE} color={colors.text} strokeWidth={2} />
          <Text style={[styles.actionPillText, { color: colors.text }]} numberOfLines={1}>
            Visitado
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** Modo colocar pin: una instrucción + Confirmar ubicación (primario) + Cancelar (secundario). */
function PlacingDraftContent({
  onConfirm,
  onCancel,
  colors,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={styles.draftActionsWrap}>
      <Text
        style={[
          styles.detailBody,
          {
            color: colors.textSecondary,
            marginBottom: BODY_ROW_GAP,
            textAlign: "center",
          },
        ]}
      >
        Toca el mapa para mover el pin
      </Text>
      <Pressable
        style={[styles.detailButton, { backgroundColor: colors.tint }]}
        onPress={onConfirm}
        accessibilityLabel="Confirmar ubicación"
        accessibilityRole="button"
      >
        <MapPin size={20} color="#fff" strokeWidth={2} />
        <Text style={styles.detailButtonText}>Confirmar ubicación</Text>
      </Pressable>
      <Pressable
        style={[
          styles.detailButton,
          { borderColor: colors.borderSubtle, borderWidth: 1 },
        ]}
        onPress={onCancel}
        accessibilityLabel="Cancelar"
        accessibilityRole="button"
      >
        <Text
          style={[styles.detailButtonTextSecondary, { color: colors.text }]}
        >
          Cancelar
        </Text>
      </Pressable>
    </View>
  );
}

function SheetBodyPanel({
  shouldScroll,
  maxBodyHeight,
  onContentLayout,
  children,
}: {
  shouldScroll: boolean;
  maxBodyHeight: number;
  onContentLayout: (e: LayoutChangeEvent) => void;
  children: React.ReactNode;
}) {
  if (shouldScroll) {
    return (
      <ScrollView
        style={[styles.bodyScroll, { maxHeight: maxBodyHeight }]}
        contentContainerStyle={styles.bodyContentWrap}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.bodyContentInner} onLayout={onContentLayout}>
          {children}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.bodyContentWrap}>
      <View style={styles.bodyContentInner} onLayout={onContentLayout}>
        {children}
      </View>
    </View>
  );
}

type SpotSheetBodyProps = {
  isMedium: boolean;
  isExpanded: boolean;
  isPoiMode: boolean;
  isDraft: boolean;
  isPlacingDraftSpot: boolean;
  poiLoading: boolean;
  pinFilter: "all" | "saved" | "visited";
  effectiveBodyNeedsScroll: boolean;
  maxBodyHeight: number;
  onMediumBodyLayout: (e: LayoutChangeEvent) => void;
  onFullBodyLayout: (e: LayoutChangeEvent) => void;
  onConfirmPlacement?: () => void;
  onClose: () => void;
  onPoiPorVisitar?: () => void | Promise<void>;
  onPoiVisitado?: () => void | Promise<void>;
  spot: SpotSheetSpot | null;
  hasDesc: boolean;
  hasCover: boolean;
  isSaved: boolean;
  isVisited: boolean;
  colors: (typeof Colors)["light"];
  colorScheme: "light" | "dark" | null;
  handleSavePin: (
    targetStatus?:
      | "to_visit"
      | "visited"
      | "clear_to_visit"
      | "clear_visited"
  ) => void;
  draftCoverUri?: string | null;
  onDraftCoverChange?: (uri: string | null) => void;
  onCreateSpot?: () => void;
  distanceKmVal: number | null;
  whyText: string | null;
  addressText: string | null;
  isAuthUser?: boolean;
  handleDirections: () => void;
  handleEdit: () => void;
  onEdit?: (spotId: string) => void;
  onImagePress?: SpotHeroImagePressHandler;
  heroImageUris?: string[];
  sheetTagChips?: { id: string; label: string }[];
  onSheetTagChipPress?: (tagId: string) => void;
  onSheetEtiquetarPress?: () => void;
  coverImageHeight?: number;
  webDesktopSidebar?: boolean;
  pinMutationTarget?: null | "saved" | "visited";
};

function SpotSheetBody({
  isMedium,
  isExpanded,
  isPoiMode,
  isDraft,
  isPlacingDraftSpot,
  poiLoading,
  pinFilter,
  effectiveBodyNeedsScroll,
  maxBodyHeight,
  onMediumBodyLayout,
  onFullBodyLayout,
  onConfirmPlacement,
  onClose,
  onPoiPorVisitar,
  onPoiVisitado,
  spot,
  hasDesc,
  hasCover,
  isSaved,
  isVisited,
  colors,
  colorScheme,
  handleSavePin,
  draftCoverUri,
  onDraftCoverChange,
  onCreateSpot,
  distanceKmVal,
  whyText,
  addressText,
  isAuthUser,
  handleDirections,
  handleEdit,
  onEdit,
  onImagePress,
  heroImageUris,
  sheetTagChips,
  onSheetTagChipPress,
  onSheetEtiquetarPress,
  coverImageHeight = COVER_HEIGHT,
  webDesktopSidebar = false,
  pinMutationTarget = null,
}: SpotSheetBodyProps) {
  const renderBodyContent = () => {
    if (isPoiMode) {
      return onPoiPorVisitar ? (
        <PoiBodyContent
          onPorVisitar={onPoiPorVisitar}
          onVisitado={onPoiVisitado}
          pinFilter={pinFilter}
          loading={poiLoading}
          colors={colors}
        />
      ) : null;
    }
    if (isDraft && isPlacingDraftSpot) {
      return (
        <PlacingDraftContent
          onConfirm={() => onConfirmPlacement?.()}
          onCancel={onClose}
          colors={colors}
        />
      );
    }
    return (
      <>
        <MediumBodyContent
          spot={spot!}
          hasDesc={hasDesc}
          hasCover={hasCover}
          isSaved={isSaved}
          isVisited={isVisited}
          isDraft={isDraft}
          colors={colors}
          colorScheme={colorScheme ?? 'light'}
          handleSavePin={handleSavePin}
          pinMutationTarget={pinMutationTarget}
          onImagePress={onImagePress}
          heroImageUris={heroImageUris}
          distanceKmVal={distanceKmVal}
          sheetTagChips={sheetTagChips}
          onSheetTagChipPress={onSheetTagChipPress}
          onSheetEtiquetarPress={onSheetEtiquetarPress}
          isAuthUser={isAuthUser}
          coverHeight={coverImageHeight}
          webDesktopSidebar={webDesktopSidebar}
        />
        {isDraft ? (
          <DraftInlineEditor
            draftCoverUri={draftCoverUri}
            onDraftCoverChange={onDraftCoverChange}
            onCreateSpot={onCreateSpot}
            colors={colors}
            colorScheme={colorScheme ?? "light"}
          />
        ) : isExpanded ? (
          <ExpandedExtra
            whyText={whyText}
            addressText={addressText}
            isAuthUser={isAuthUser}
            colors={colors}
            handleDirections={handleDirections}
            handleEdit={handleEdit}
            onEdit={onEdit}
          />
        ) : null}
      </>
    );
  };

  return (
    <>
      {isMedium ? (
        <SheetBodyPanel
          shouldScroll={effectiveBodyNeedsScroll}
          maxBodyHeight={maxBodyHeight}
          onContentLayout={onMediumBodyLayout}
        >
          {renderBodyContent()}
        </SheetBodyPanel>
      ) : null}
      {isExpanded ? (
        <SheetBodyPanel
          shouldScroll={effectiveBodyNeedsScroll}
          maxBodyHeight={maxBodyHeight}
          onContentLayout={onFullBodyLayout}
        >
          {renderBodyContent()}
        </SheetBodyPanel>
      ) : null}
    </>
  );
}

const CONTAINER_PADDING_BOTTOM = 16;

export function SpotSheet({
  spot,
  onClose,
  onOpenDetail,
  state,
  onStateChange,
  onShare,
  onSavePin,
  userCoords,
  isAuthUser,
  onDirections,
  onEdit,
  onEditDraft,
  onSheetHeightChange,
  isPlacingDraftSpot = false,
  onConfirmPlacement,
  onDraftBackToPlacing,
  draftCoverUri = null,
  onDraftCoverChange,
  onCreateSpot,
  poi = null,
  pinFilter = "all",
  onPoiPorVisitar,
  onPoiVisitado,
  onPoiShare,
  poiLoading = false,
  displayTitleOverride,
  onImagePress,
  heroImageUris,
  sheetTagChips,
  onSheetTagChipPress,
  onSheetEtiquetarPress,
  webDesktopSidebar = false,
  pinMutationTarget = null,
}: SpotSheetProps) {
  const [headerHeight, setHeaderHeight] = useState(SHEET_PEEK_HEIGHT);
  const [dragAreaHeight, setDragAreaHeight] = useState(0);
  const [mediumBodyContentHeight, setMediumBodyContentHeight] = useState(0);
  const [fullBodyContentHeight, setFullBodyContentHeight] = useState(0);
  const [showDiscardDraftConfirm, setShowDiscardDraftConfirm] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const useWebConstrainedSheet =
    Platform.OS === "web" &&
    webSearchUsesConstrainedPanelWidth(windowWidth) &&
    !webDesktopSidebar;

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);
  const onDragAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setDragAreaHeight(h);
  }, []);
  const onMediumBodyLayout = useCallback((e: LayoutChangeEvent) => {
    setMediumBodyContentHeight(e.nativeEvent.layout.height);
  }, []);
  const onFullBodyLayout = useCallback((e: LayoutChangeEvent) => {
    setFullBodyContentHeight(e.nativeEvent.layout.height);
  }, []);

  const colorScheme = useColorScheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const insets = useSafeAreaInsets();
  const vh = Dimensions.get("window").height;
  /** Altura estimada del handle (handleRow: SheetHandle padding+bar + marginBottom). */
  const HANDLE_ROW_ESTIMATE = 20;
  const collapsedFromMeasure =
    dragAreaHeight > 0
      ? HEADER_PADDING_V + dragAreaHeight
      : headerHeight > 0 && headerHeight < 90
        ? HEADER_PADDING_V + HANDLE_ROW_ESTIMATE + headerHeight
        : 0;
  const collapsedAnchor =
    collapsedFromMeasure > 0 ? collapsedFromMeasure : ANCHOR_COLLAPSED_PX;
  const mediumAnchor = Math.round(vh * ANCHOR_MEDIUM_RATIO);
  const expandedAnchor = Math.round(vh * ANCHOR_EXPANDED_RATIO);

  const isDraftForAnchor = spot ? spot.id.startsWith("draft_") : false;
  const isDraftWithMinimalContent = isDraftForAnchor && !isPlacingDraftSpot;

  /**
   * Padding inferior del chrome del sheet: en peek/medium solo safe-area + mínimo (sin 24px extra
   * que dejaba hueco y disparaba scroll en el body). En expanded se mantiene más respiro por scroll.
   */
  const sheetFooterReservePeekOrMedium = Math.max(insets.bottom, Spacing.sm);
  const sheetFooterReserveExpanded = Math.max(
    24,
    CONTAINER_PADDING_BOTTOM + insets.bottom,
  );

  /** Altura total del contenido (header + body + padding) para no dejar espacio vacío bajo el sheet. */
  const mediumContentTotal =
    collapsedAnchor +
    mediumBodyContentHeight +
    sheetFooterReservePeekOrMedium;
  const expandedContentTotal =
    collapsedAnchor +
    (fullBodyContentHeight || mediumBodyContentHeight) +
    sheetFooterReserveExpanded;
  const mediumVisible =
    mediumBodyContentHeight > 0
      ? Math.min(mediumAnchor, mediumContentTotal)
      : mediumAnchor;
  const expandedVisibleRaw =
    (fullBodyContentHeight || mediumBodyContentHeight) > 0
      ? Math.min(expandedAnchor, expandedContentTotal)
      : expandedAnchor;
  /** Draft "Agregar imagen": anchor adaptativo para evitar sheet alto + scroll innecesario (MS-6). */
  const draftExpandedCap =
    collapsedAnchor +
    DRAFT_BODY_HEIGHT_ESTIMATE +
    sheetFooterReservePeekOrMedium;
  const expandedVisible = isDraftWithMinimalContent
    ? Math.min(expandedVisibleRaw, draftExpandedCap)
    : expandedVisibleRaw;

  const translateYToAnchor = useCallback(
    (s: SheetState) => {
      if (s === "expanded") return expandedAnchor - expandedVisible;
      if (s === "medium") return expandedAnchor - mediumVisible;
      return expandedAnchor - collapsedAnchor;
    },
    [expandedAnchor, mediumVisible, expandedVisible, collapsedAnchor],
  );

  /** No mostrar ni animar hasta tener anchors estables (evita "shrink" al montar). */
  const isMeasured =
    webDesktopSidebar ||
    (dragAreaHeight > 0 &&
      (state === "peek" ||
        (state === "medium" && mediumBodyContentHeight > 0) ||
        (state === "expanded" &&
          (fullBodyContentHeight > 0 || mediumBodyContentHeight > 0))));

  const translateYShared = useSharedValue(vh);
  const opacityShared = useSharedValue(0);
  const reducedMotionShared = useSharedValue(prefersReducedMotion ? 1 : 0);
  const expandedAnchorSV = useSharedValue(expandedAnchor);
  const mediumVisibleSV = useSharedValue(mediumVisible);
  const expandedVisibleSV = useSharedValue(expandedVisible);
  const collapsedAnchorSV = useSharedValue(collapsedAnchor);
  const dragStartTranslateYSV = useSharedValue(0);
  const isDraggingRef = useRef(false);
  const hasAnimatedEntranceRef = useRef(false);
  const lastSpotIdRef = useRef<string | null>(null);

  /** Reset de entrada solo en transición sin spot/poi → con spot/poi. Spot A → spot B o POI: no resetear, solo actualizar ref. */
  const effectiveId = spot?.id ?? (poi ? `poi-${poi.lat}-${poi.lng}` : null);
  useEffect(() => {
    if (effectiveId !== lastSpotIdRef.current) {
      const wasNull = lastSpotIdRef.current === null;
      lastSpotIdRef.current = effectiveId;
      if (wasNull && effectiveId !== null) {
        hasAnimatedEntranceRef.current = false;
        translateYShared.value = vh;
        opacityShared.value = 0;
      }
    }
  }, [effectiveId, translateYShared, opacityShared, vh]);

  useLayoutEffect(() => {
    if (!webDesktopSidebar) return;
    translateYShared.value = 0;
    opacityShared.value = 1;
    hasAnimatedEntranceRef.current = true;
  }, [webDesktopSidebar, translateYShared, opacityShared]);

  useEffect(() => {
    reducedMotionShared.value = prefersReducedMotion ? 1 : 0;
  }, [prefersReducedMotion, reducedMotionShared]);
  useEffect(() => {
    expandedAnchorSV.value = expandedAnchor;
    mediumVisibleSV.value = mediumVisible;
    expandedVisibleSV.value = expandedVisible;
    collapsedAnchorSV.value = collapsedAnchor;
  }, [
    expandedAnchor,
    mediumVisible,
    expandedVisible,
    collapsedAnchor,
    expandedAnchorSV,
    mediumVisibleSV,
    expandedVisibleSV,
    collapsedAnchorSV,
  ]);

  /** Entrada: solo cuando hay medida; animar desde abajo (offscreen) al anchor del estado. */
  useEffect(() => {
    if (webDesktopSidebar || !isMeasured || hasAnimatedEntranceRef.current) return;
    hasAnimatedEntranceRef.current = true;
    const targetTy = translateYToAnchor(state);
    const duration = prefersReducedMotion ? 0 : DURATION_PROGRAMMATIC;
    translateYShared.value = withTiming(targetTy, {
      duration,
      easing: EASING_SHEET,
    });
    opacityShared.value = withTiming(1, { duration, easing: EASING_SHEET });
  }, [
    isMeasured,
    state,
    translateYToAnchor,
    translateYShared,
    opacityShared,
    prefersReducedMotion,
    webDesktopSidebar,
  ]);

  /** Sincronizar estado → translateY solo después de la primera entrada. */
  useEffect(() => {
    if (
      webDesktopSidebar ||
      !isMeasured ||
      !hasAnimatedEntranceRef.current ||
      isDraggingRef.current
    )
      return;
    const targetTy = translateYToAnchor(state);
    const duration = prefersReducedMotion ? 0 : DURATION_PROGRAMMATIC;
    translateYShared.value = withTiming(targetTy, {
      duration,
      easing: EASING_SHEET,
    });
  }, [
    isMeasured,
    state,
    translateYToAnchor,
    translateYShared,
    prefersReducedMotion,
    webDesktopSidebar,
  ]);

  useEffect(() => {
    const h =
      state === "peek"
        ? collapsedAnchor
        : state === "medium"
          ? mediumVisible
          : expandedVisible;
    onSheetHeightChange?.(h);
  }, [
    state,
    onSheetHeightChange,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
  ]);

  const handleHeaderTap = useCallback(() => {
    const next: SheetState =
      state === "peek" ? "medium" : state === "medium" ? "expanded" : "medium";
    const targetTy = translateYToAnchor(next);
    const duration = prefersReducedMotion
      ? 0
      : (state === "peek" && next === "medium") ||
          (state === "medium" && next === "expanded")
        ? DURATION_COLLAPSED_MEDIUM
        : state === "expanded" && next === "medium"
          ? DURATION_MEDIUM_EXPANDED
          : DURATION_PROGRAMMATIC;
    translateYShared.value = withTiming(targetTy, {
      duration,
      easing: EASING_SHEET,
    });
    onStateChange(next);
    const nextH = next === "medium" ? mediumVisible : expandedVisible;
    onSheetHeightChange?.(nextH);
  }, [
    state,
    onStateChange,
    onSheetHeightChange,
    translateYToAnchor,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
    translateYShared,
    prefersReducedMotion,
  ]);

  const setDraggingTrue = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  const onSnapEnd = useCallback(
    (nextState: SheetState) => {
      isDraggingRef.current = false;
      onStateChange(nextState);
      const h = getSheetHeightForState(
        nextState,
        collapsedAnchor,
        mediumVisible,
        expandedVisible,
      );
      onSheetHeightChange?.(h);
    },
    [
      onStateChange,
      onSheetHeightChange,
      collapsedAnchor,
      mediumVisible,
      expandedVisible,
    ],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      dragStartTranslateYSV.value = translateYShared.value;
      runOnJS(setDraggingTrue)();
    })
    .onUpdate((e) => {
      "worklet";
      const maxTy = expandedAnchorSV.value - collapsedAnchorSV.value;
      const next = dragStartTranslateYSV.value + e.translationY;
      translateYShared.value = Math.max(0, Math.min(maxTy, next));
    })
    .onEnd((e) => {
      "worklet";
      const exp = expandedAnchorSV.value;
      const medVis = mediumVisibleSV.value;
      const expVis = expandedVisibleSV.value;
      const col = collapsedAnchorSV.value;
      const currentTy = translateYShared.value;
      const visible = exp - currentTy;
      const velocityY = e.velocityY;

      const nextState = resolveNextSheetStateFromGesture({
        visible,
        velocityY,
        collapsedAnchor: col,
        mediumVisible: medVis,
        expandedVisible: expVis,
        velocitySnapThreshold: VELOCITY_SNAP_THRESHOLD,
        snapPositionThreshold: SNAP_POSITION_THRESHOLD,
      });

      const targetTy =
        nextState === "expanded"
          ? exp - expVis
          : nextState === "medium"
            ? exp - medVis
            : exp - col;
      const duration = reducedMotionShared.value ? 0 : DURATION_PROGRAMMATIC;
      translateYShared.value = withTiming(
        targetTy,
        { duration, easing: EASING_SHEET },
        (finished) => {
          if (finished) runOnJS(onSnapEnd)(nextState);
        },
      );
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacityShared.value,
    transform: [{ translateY: translateYShared.value }],
  }));

  /** Sidebar web: un solo panel expandido; si medium y expanded son ambos true, SpotSheetBody duplica todo el cuerpo. */
  const isMedium = webDesktopSidebar ? false : state === "medium";
  const isExpanded = webDesktopSidebar || state === "expanded";
  const bodyContentHeight = isMedium
    ? mediumBodyContentHeight
    : isExpanded
      ? fullBodyContentHeight || mediumBodyContentHeight
      : 0;
  const viewportHeight = Dimensions.get("window").height;
  const maxBodyFromViewport = Math.max(
    0,
    viewportHeight -
      MIN_MAP_VISIBLE_TOP -
      headerHeight -
      12 -
      CONTAINER_PADDING_BOTTOM,
  );
  const maxBodyHeight = isExpanded
    ? maxBodyFromViewport
    : Math.min(SHEET_MEDIUM_MAX_BODY, maxBodyFromViewport);
  const bodyNeedsScroll = bodyContentHeight > maxBodyHeight;
  const isPoiMode = !spot && !!poi;
  if (spot == null && !poi) return null;

  const isDraft = spot ? spot.id.startsWith("draft_") : false;
  /**
   * Medium: nunca ScrollView en el body (mobile): el detent crece con `mediumContentTotal`;
   * un maxHeight + padding generaba scroll con barra aun habiendo espacio.
   * Expanded: scroll solo si el contenido supera el viewport disponible.
   * Draft mínimo: sin scroll (MS-6).
   */
  const effectiveBodyNeedsScroll =
    state === "medium"
      ? false
      : isDraft && !isPlacingDraftSpot
        ? false
        : bodyNeedsScroll;
  const colors = Colors[colorScheme ?? "light"];
  const hasDesc = spot ? Boolean(spot.description_short?.trim()) : false;
  const hasCover = spot
    ? (heroImageUris != null && heroImageUris.length > 0) ||
      Boolean(spot.cover_image_url)
    : false;
  const isSaved = spot ? (spot.saved ?? spot.pinStatus === "to_visit") : false;
  const isVisited = spot ? (spot.visited ?? spot.pinStatus === "visited") : false;
  const distanceKmVal =
    spot && userCoords != null
      ? distanceKm(
          userCoords.latitude,
          userCoords.longitude,
          spot.latitude,
          spot.longitude,
        )
      : null;
  const whyText = spot ? ((spot.why ?? spot.description_long)?.trim() || null) : null;
  const addressText = spot ? (spot.address?.trim() || null) : null;
  const baseTitle = isPoiMode && poi ? poi.name : spot?.title ?? "";
  const displayTitle = displayTitleOverride ?? baseTitle;

  const handleShare = () => {
    if (isPoiMode && onPoiShare) onPoiShare();
    else if (onShare) onShare();
    else if (__DEV__ && spot) console.log("[SpotSheet] Share stub", spot.id);
  };

  const handleSavePin = (
    targetStatus?:
      | "to_visit"
      | "visited"
      | "clear_to_visit"
      | "clear_visited"
  ) => {
    if (onSavePin) onSavePin(targetStatus);
  };

  const handleDirections = () => {
    if (spot && onDirections) onDirections(spot);
    else if (spot) Linking.openURL(getMapsDirectionsUrl(spot.latitude, spot.longitude));
  };

  const handleEdit = () => {
    if (spot && onEdit) onEdit(spot.id);
  };

  /** Offset del borde inferior para que el sheet colapsado no quede pegado al viewport (OL-058).
   * En expanded, bottom: 0 para que no quede hueco visible del mapa en la base. */
  const bottomOffset = Math.max(Spacing.md, insets.bottom);
  const sheetBottom = state === "expanded" ? 0 : bottomOffset;

  const sheetContainerPaddingBottom =
    state === "expanded"
      ? sheetFooterReserveExpanded
      : sheetFooterReservePeekOrMedium;

  const sheetAnimated = (
    <Animated.View
      style={[
        styles.container,
        webDesktopSidebar && styles.containerDesktopSidebar,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          height: webDesktopSidebar ? ("100%" as const) : expandedAnchor,
          bottom: webDesktopSidebar ? 0 : useWebConstrainedSheet ? 0 : sheetBottom,
          paddingBottom: sheetContainerPaddingBottom,
        },
        webDesktopSidebar ? null : animatedContainerStyle,
      ]}
    >
      {/* CONTRATO drag 3 estados: Pan gesture en handle/header → peek ↔ medium ↔ expanded; sidebar web: estático */}
      {webDesktopSidebar ? (
        <View>
          <SpotSheetHeader
            isDraft={isDraft}
            isPlacingDraftSpot={isPlacingDraftSpot}
            isPoiMode={isPoiMode}
            poiLoading={poiLoading}
            displayTitle={displayTitle}
            state="expanded"
            colors={colors}
            onHeaderTap={handleHeaderTap}
            onShare={handleShare}
            onDraftBackToPlacing={onDraftBackToPlacing}
            onClose={isDraft ? () => setShowDiscardDraftConfirm(true) : onClose}
            onDragAreaLayout={onDragAreaLayout}
            onHeaderLayout={onHeaderLayout}
            hideSheetHandle
          />
        </View>
      ) : (
        <GestureDetector gesture={panGesture}>
          <SpotSheetHeader
            isDraft={isDraft}
            isPlacingDraftSpot={isPlacingDraftSpot}
            isPoiMode={isPoiMode}
            poiLoading={poiLoading}
            displayTitle={displayTitle}
            state={state}
            colors={colors}
            onHeaderTap={handleHeaderTap}
            onShare={handleShare}
            onDraftBackToPlacing={onDraftBackToPlacing}
            onClose={isDraft ? () => setShowDiscardDraftConfirm(true) : onClose}
            onDragAreaLayout={onDragAreaLayout}
            onHeaderLayout={onHeaderLayout}
          />
        </GestureDetector>
      )}

      {/* CONTRATO scroll único: un solo ScrollView en body; header fijo; scroll solo si overflow */}
      <SpotSheetBody
        isMedium={isMedium}
        isExpanded={isExpanded}
        isPoiMode={isPoiMode}
        isDraft={isDraft}
        isPlacingDraftSpot={isPlacingDraftSpot}
        poiLoading={poiLoading}
        pinFilter={pinFilter}
        effectiveBodyNeedsScroll={effectiveBodyNeedsScroll}
        maxBodyHeight={maxBodyHeight}
        onMediumBodyLayout={onMediumBodyLayout}
        onFullBodyLayout={onFullBodyLayout}
        onConfirmPlacement={onConfirmPlacement}
        onClose={onClose}
        onPoiPorVisitar={onPoiPorVisitar}
        onPoiVisitado={onPoiVisitado}
        spot={spot}
        hasDesc={hasDesc}
        hasCover={hasCover}
        isSaved={isSaved}
        isVisited={isVisited}
        colors={colors}
        colorScheme={colorScheme ?? 'light'}
        handleSavePin={handleSavePin}
        draftCoverUri={draftCoverUri}
        onDraftCoverChange={onDraftCoverChange}
        onCreateSpot={onCreateSpot}
        distanceKmVal={distanceKmVal}
        whyText={whyText}
        addressText={addressText}
        isAuthUser={isAuthUser}
        handleDirections={handleDirections}
        handleEdit={handleEdit}
        onEdit={onEdit}
        onImagePress={onImagePress}
        heroImageUris={heroImageUris}
        sheetTagChips={sheetTagChips}
        onSheetTagChipPress={onSheetTagChipPress}
        onSheetEtiquetarPress={onSheetEtiquetarPress}
        coverImageHeight={
          webDesktopSidebar ? COVER_HEIGHT_WEB_SIDEBAR : COVER_HEIGHT
        }
        webDesktopSidebar={webDesktopSidebar}
        pinMutationTarget={pinMutationTarget}
      />

      <ConfirmModal
        visible={showDiscardDraftConfirm}
        title="¿Descartar borrador sin guardar?"
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        variant="destructive"
        onConfirm={() => {
          setShowDiscardDraftConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardDraftConfirm(false)}
      />
    </Animated.View>
  );

  if (webDesktopSidebar) {
    return (
      <View style={styles.webSidebarColumnHost} pointerEvents="box-none">
        <View style={styles.webSidebarColumnInner}>{sheetAnimated}</View>
      </View>
    );
  }

  if (useWebConstrainedSheet) {
    return (
      <View
        style={[
          styles.webSheetWidthHost,
          { bottom: sheetBottom, zIndex: EXPLORE_LAYER_Z.SHEET_BASE },
        ]}
        pointerEvents="box-none"
      >
        <View style={{ width: "100%", maxWidth: WEB_SHEET_MAX_WIDTH }}>{sheetAnimated}</View>
      </View>
    );
  }

  return sheetAnimated;
}

const HEADER_PADDING_V = 12;
const HEADER_PADDING_H = 14;
const BODY_PADDING_H = 14;

const styles = StyleSheet.create({
  /** Web desktop: centra el sheet y limita ancho (OL-WEB-RESPONSIVE-001 WR-03). */
  webSheetWidthHost: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  webSidebarColumnHost: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
  },
  webSidebarColumnInner: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  },
  containerDesktopSidebar: {
    top: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    paddingHorizontal: HEADER_PADDING_H,
    paddingTop: HEADER_PADDING_V,
    paddingBottom: 16,
    zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
  },
  dragArea: {
    flexShrink: 0,
  },
  handleRow: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  draftBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  draftBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  draftActionsWrap: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  draftTitleInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  draftDescInput: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 56,
    maxHeight: 80,
  },
  draftCharCount: {
    fontSize: 12,
    alignSelf: "flex-end",
  },
  draftCoverLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  draftCoverPreviewWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 320,
    aspectRatio: 16 / 10,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: BODY_ROW_GAP,
  },
  draftCoverPreviewInner: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  draftCoverRemoveBtn: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  draftCoverRemoveLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  draftCoverAddCell: {
    width: 200,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: Radius.md,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    minHeight: DRAFT_COVER_ADD_MIN_HEIGHT,
    marginBottom: BODY_ROW_GAP,
  },
  draftCoverAddLabel: {
    fontSize: 17,
    fontWeight: "500",
    marginTop: Spacing.sm,
  },
  closeButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContentWrap: {
    paddingHorizontal: BODY_PADDING_H,
    paddingBottom: 16,
    rowGap: BODY_ROW_GAP,
    flexGrow: 0,
  },
  bodyContentInner: {
    rowGap: BODY_ROW_GAP,
  },
  descriptionWrap: {
    marginBottom: BODY_ROW_GAP,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  imageRow: {
    marginBottom: BODY_ROW_GAP,
  },
  imageWrap: {
    width: "100%",
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    gap: ACTION_PILL_GAP,
    width: "100%",
    marginBottom: BODY_ROW_GAP,
  },
  actionPill: {
    flex: 1,
    height: ACTION_PILL_HEIGHT,
    borderRadius: Radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionPillText: {
    fontSize: 15,
    fontWeight: "600",
  },
  poiLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    minHeight: ACTION_PILL_HEIGHT,
  },
  poiLoadingText: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: BODY_ROW_GAP,
    width: "100%",
  },
  metaDistance: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaChipsCluster: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  metaTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    maxWidth: 220,
  },
  metaTagChipLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  metaEtiquetar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  metaEtiquetarLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailBlock: {
    marginBottom: BODY_ROW_GAP,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  detailButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "600",
  },
});
