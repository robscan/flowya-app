/**
 * SpotSheet — Sheet inferior estilo Apple Maps (Explorar vNext).
 * 3 estados: PEEK (solo header), MEDIUM (header + resumen), EXPANDED (header + resumen con más espacio).
 * Drag + snap según docs/contracts/MOTION_SHEET.md (translateY, anchors, 25% + velocity).
 */

import { IconButton } from "@/components/design-system/icon-button";
import { ImagePlaceholder } from "@/components/design-system/image-placeholder";
import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { SheetHandle } from "@/components/design-system/sheet-handle";
import { SpotImage } from "@/components/design-system/spot-image";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    distanceKm,
    formatDistanceKm,
    getMapsDirectionsUrl,
} from "@/lib/geo-utils";
import {
    ArrowLeft,
    CheckCircle,
    MapPin,
    Pencil,
    Pin,
    Share2,
    X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    type LayoutChangeEvent,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
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
const HEADER_BUTTON_SIZE = 40;
const ACTION_PILL_HEIGHT = 46;
const ACTION_PILL_GAP = 12;
const ACTION_ICON_SIZE = 20;
const BODY_ROW_GAP = 14;

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
  onSavePin?: () => void;
  onMarkVisited?: () => void;
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
  handleToggleSaved: () => void;
  handleToggleVisited: () => void;
  handleDirections: () => void;
  handleEdit: () => void;
  onEdit?: (spotId: string) => void;
};

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
  handleToggleSaved,
  handleToggleVisited,
}: Pick<
  BodyContentProps,
  | "spot"
  | "hasDesc"
  | "hasCover"
  | "isSaved"
  | "isVisited"
  | "colors"
  | "colorScheme"
  | "handleToggleSaved"
  | "handleToggleVisited"
> & { isDraft?: boolean }) {
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
          <View style={styles.imageWrap}>
            <SpotImage
              uri={spot.cover_image_url}
              height={COVER_HEIGHT}
              borderRadius={Radius.md}
              colorScheme={colorScheme ?? undefined}
            />
          </View>
        </View>
      ) : null}
      {!isDraft ? (
        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.actionPill,
              {
                backgroundColor: isSaved
                  ? colors.stateToVisit
                  : colors.backgroundElevated,
                borderColor: colors.borderSubtle,
                borderWidth: isSaved ? 0 : 1,
              },
            ]}
            onPress={handleToggleSaved}
            accessibilityLabel={isSaved ? "Guardado" : "Guardar"}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved }}
          >
            <Pin
              size={ACTION_ICON_SIZE}
              color={isSaved ? "#ffffff" : colors.text}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.actionPillText,
                { color: isSaved ? "#ffffff" : colors.text },
              ]}
              numberOfLines={1}
            >
              Guardar
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionPill,
              {
                backgroundColor: isVisited
                  ? colors.stateSuccess
                  : colors.backgroundElevated,
                borderColor: colors.borderSubtle,
                borderWidth: isVisited ? 0 : 1,
              },
            ]}
            onPress={handleToggleVisited}
            accessibilityLabel={isVisited ? "Visitado" : "Visitado"}
            accessibilityRole="button"
            accessibilityState={{ selected: isVisited }}
          >
            <CheckCircle
              size={ACTION_ICON_SIZE}
              color={isVisited ? "#ffffff" : colors.text}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.actionPillText,
                { color: isVisited ? "#ffffff" : colors.text },
              ]}
              numberOfLines={1}
            >
              Visitado
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

/** Contenido extra solo en EXPANDED: distancia, Por qué importa, dirección, Cómo llegar, Editar. */
function ExpandedExtra({
  distanceKmVal,
  whyText,
  addressText,
  isAuthUser,
  colors,
  handleDirections,
  handleEdit,
  onEdit,
}: Pick<
  BodyContentProps,
  | "distanceKmVal"
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
      {distanceKmVal != null ? (
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
          A {formatDistanceKm(distanceKmVal)}
        </Text>
      ) : null}
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
      <View style={styles.detailBlock}>
        <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
          Dirección
        </Text>
        <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
          {addressText || "Sin dirección guardada"}
        </Text>
      </View>
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
          accessibilityLabel="Crear spot"
          accessibilityRole="button"
        >
          <Text style={styles.detailButtonText}>Crear spot</Text>
        </Pressable>
      ) : null}
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

const CONTAINER_PADDING_BOTTOM = 16;

export function SpotSheet({
  spot,
  onClose,
  onOpenDetail,
  state,
  onStateChange,
  onShare,
  onSavePin,
  onMarkVisited,
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
}: SpotSheetProps) {
  const [headerHeight, setHeaderHeight] = useState(SHEET_PEEK_HEIGHT);
  const [dragAreaHeight, setDragAreaHeight] = useState(0);
  const [mediumBodyContentHeight, setMediumBodyContentHeight] = useState(0);
  const [fullBodyContentHeight, setFullBodyContentHeight] = useState(0);
  const [showDiscardDraftConfirm, setShowDiscardDraftConfirm] = useState(false);

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

  /** Altura total del contenido (header + body + padding) para no dejar espacio vacío bajo el sheet. */
  const mediumContentTotal =
    collapsedAnchor + mediumBodyContentHeight + CONTAINER_PADDING_BOTTOM;
  const expandedContentTotal =
    collapsedAnchor +
    (fullBodyContentHeight || mediumBodyContentHeight) +
    CONTAINER_PADDING_BOTTOM;
  const mediumVisible =
    mediumBodyContentHeight > 0
      ? Math.min(mediumAnchor, mediumContentTotal)
      : mediumAnchor;
  const expandedVisible =
    (fullBodyContentHeight || mediumBodyContentHeight) > 0
      ? Math.min(expandedAnchor, expandedContentTotal)
      : expandedAnchor;

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
    dragAreaHeight > 0 &&
    (state === "peek" ||
      (state === "medium" && mediumBodyContentHeight > 0) ||
      (state === "expanded" &&
        (fullBodyContentHeight > 0 || mediumBodyContentHeight > 0)));

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

  /** Reset de entrada solo en transición sin spot → con spot. Spot A → spot B: no resetear, solo actualizar ref; sheet permanece visible en MEDIUM. */
  useEffect(() => {
    const id = spot?.id ?? null;
    if (id !== lastSpotIdRef.current) {
      const wasNull = lastSpotIdRef.current === null;
      lastSpotIdRef.current = id;
      if (wasNull && id !== null) {
        hasAnimatedEntranceRef.current = false;
        translateYShared.value = vh;
        opacityShared.value = 0;
      }
    }
  }, [spot?.id, translateYShared, opacityShared, vh]);

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
    if (!isMeasured || hasAnimatedEntranceRef.current) return;
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
  ]);

  /** Sincronizar estado → translateY solo después de la primera entrada. */
  useEffect(() => {
    if (!isMeasured || !hasAnimatedEntranceRef.current || isDraggingRef.current)
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
    const nextH =
      next === "peek"
        ? collapsedAnchor
        : next === "medium"
          ? mediumVisible
          : expandedVisible;
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
      const h =
        nextState === "peek"
          ? collapsedAnchor
          : nextState === "medium"
            ? mediumVisible
            : expandedVisible;
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

      let nextState: SheetState;
      const midCollapsedMedium = col + (medVis - col) * 0.5;
      if (visible <= midCollapsedMedium) {
        const band = medVis - col;
        const towardMedium = band > 0 ? (visible - col) / band : 0;
        if (velocityY < -VELOCITY_SNAP_THRESHOLD) nextState = "medium";
        else if (velocityY > VELOCITY_SNAP_THRESHOLD) nextState = "peek";
        else
          nextState =
            towardMedium >= SNAP_POSITION_THRESHOLD ? "medium" : "peek";
      } else {
        const band = expVis - medVis;
        const towardExpanded = band > 0 ? (visible - medVis) / band : 0;
        if (velocityY < -VELOCITY_SNAP_THRESHOLD) nextState = "expanded";
        else if (velocityY > VELOCITY_SNAP_THRESHOLD) nextState = "medium";
        else
          nextState =
            towardExpanded >= SNAP_POSITION_THRESHOLD ? "expanded" : "medium";
      }

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

  const isMedium = state === "medium";
  const isExpanded = state === "expanded";
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
  const effectiveBodyHeight = Math.min(bodyContentHeight || 0, maxBodyHeight);
  const bodyNeedsScroll = bodyContentHeight > maxBodyHeight;
  if (spot == null) return null;

  const isDraft = spot.id.startsWith("draft_");
  const colors = Colors[colorScheme ?? "light"];
  const hasDesc = Boolean(spot.description_short?.trim());
  const hasCover = Boolean(spot.cover_image_url);
  const isSaved = spot.saved ?? spot.pinStatus === "to_visit";
  const isVisited = spot.visited ?? spot.pinStatus === "visited";
  const distanceKmVal =
    userCoords != null
      ? distanceKm(
          userCoords.latitude,
          userCoords.longitude,
          spot.latitude,
          spot.longitude,
        )
      : null;
  const whyText = (spot.why ?? spot.description_long)?.trim() || null;
  const addressText = spot.address?.trim() || null;

  const handleShare = () => {
    if (onShare) onShare();
    else if (__DEV__) console.log("[SpotSheet] Share stub", spot.id);
  };

  const handleToggleSaved = () => {
    if (onSavePin) onSavePin();
  };

  const handleToggleVisited = () => {
    if (onMarkVisited) onMarkVisited();
  };

  const handleDirections = () => {
    if (onDirections) onDirections(spot);
    else Linking.openURL(getMapsDirectionsUrl(spot.latitude, spot.longitude));
  };

  const handleEdit = () => {
    if (onEdit) onEdit(spot.id);
  };

  /** Offset del borde inferior para que el sheet colapsado no quede pegado al viewport (OL-058). */
  const bottomOffset = Math.max(Spacing.md, insets.bottom);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          height: expandedAnchor,
          bottom: bottomOffset,
          paddingBottom: Math.max(24, CONTAINER_PADDING_BOTTOM + insets.bottom),
        },
        animatedContainerStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.dragArea} onLayout={onDragAreaLayout}>
          <View style={styles.handleRow}>
            <SheetHandle onPress={handleHeaderTap} />
          </View>
          <View style={styles.headerRow} onLayout={onHeaderLayout}>
            {!isDraft ? (
              <IconButton
                variant="default"
                size={HEADER_BUTTON_SIZE}
                onPress={handleShare}
                accessibilityLabel="Compartir"
              >
                <Share2 size={20} color={colors.text} strokeWidth={2} />
              </IconButton>
            ) : isDraft && !isPlacingDraftSpot && onDraftBackToPlacing ? (
              <IconButton
                variant="default"
                size={HEADER_BUTTON_SIZE}
                onPress={onDraftBackToPlacing}
                accessibilityLabel="Atrás"
              >
                <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
              </IconButton>
            ) : (
              <View
                style={{
                  width: HEADER_BUTTON_SIZE,
                  height: HEADER_BUTTON_SIZE,
                }}
              />
            )}
            {isDraft ? (
              <View style={styles.titleWrap}>
                <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {spot.title}
                </Text>
                <View
                  style={[
                    styles.draftBadge,
                    { backgroundColor: colors.borderSubtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.draftBadgeText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    BORRADOR
                  </Text>
                </View>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.titleWrap}
                onPress={handleHeaderTap}
                accessibilityLabel={
                  state === "peek"
                    ? "Expandir"
                    : state === "medium"
                      ? "Expandir más"
                      : "Reducir"
                }
                accessibilityRole="button"
              >
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {spot.title}
                  </Text>
                </View>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.closeButton,
                { backgroundColor: colors.borderSubtle },
              ]}
              onPress={
                isDraft ? () => setShowDiscardDraftConfirm(true) : onClose
              }
              accessibilityLabel={isDraft ? "Descartar borrador" : "Cerrar"}
              accessibilityRole="button"
            >
              <X size={20} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </GestureDetector>

      {/* Body MEDIUM: solo descripción + imagen + Guardar/Visitado; altura al contenido; scroll solo si supera max */}
      {isMedium ? (
        bodyNeedsScroll ? (
          <ScrollView
            style={[styles.bodyScroll, { maxHeight: maxBodyHeight }]}
            contentContainerStyle={styles.bodyContentWrap}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.bodyContentInner} onLayout={onMediumBodyLayout}>
              {isDraft && isPlacingDraftSpot ? (
                <PlacingDraftContent
                  onConfirm={() => onConfirmPlacement?.()}
                  onCancel={onClose}
                  colors={colors}
                />
              ) : (
                <>
                  <MediumBodyContent
                    spot={spot}
                    hasDesc={hasDesc}
                    hasCover={hasCover}
                    isSaved={isSaved}
                    isVisited={isVisited}
                    isDraft={isDraft}
                    colors={colors}
                    colorScheme={colorScheme}
                    handleToggleSaved={handleToggleSaved}
                    handleToggleVisited={handleToggleVisited}
                  />
                  {isDraft ? (
                    <DraftInlineEditor
                      draftCoverUri={draftCoverUri}
                      onDraftCoverChange={onDraftCoverChange}
                      onCreateSpot={onCreateSpot}
                      colors={colors}
                      colorScheme={colorScheme ?? "light"}
                    />
                  ) : null}
                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.bodyContentWrap}>
            <View style={styles.bodyContentInner} onLayout={onMediumBodyLayout}>
              {isDraft && isPlacingDraftSpot ? (
                <PlacingDraftContent
                  onConfirm={() => onConfirmPlacement?.()}
                  onCancel={onClose}
                  colors={colors}
                />
              ) : (
                <>
                  <MediumBodyContent
                    spot={spot}
                    hasDesc={hasDesc}
                    hasCover={hasCover}
                    isSaved={isSaved}
                    isVisited={isVisited}
                    isDraft={isDraft}
                    colors={colors}
                    colorScheme={colorScheme}
                    handleToggleSaved={handleToggleSaved}
                    handleToggleVisited={handleToggleVisited}
                  />
                  {isDraft ? (
                    <DraftInlineEditor
                      draftCoverUri={draftCoverUri}
                      onDraftCoverChange={onDraftCoverChange}
                      onCreateSpot={onCreateSpot}
                      colors={colors}
                      colorScheme={colorScheme ?? "light"}
                    />
                  ) : null}
                </>
              )}
            </View>
          </View>
        )
      ) : null}

      {/* Body EXPANDED: medium + resto (distancia, Por qué, dirección, Cómo llegar, Editar); para draft solo DraftInlineEditor */}
      {isExpanded ? (
        bodyNeedsScroll ? (
          <ScrollView
            style={[styles.bodyScroll, { maxHeight: maxBodyHeight }]}
            contentContainerStyle={styles.bodyContentWrap}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.bodyContentInner} onLayout={onFullBodyLayout}>
              {isDraft && isPlacingDraftSpot ? (
                <PlacingDraftContent
                  onConfirm={() => onConfirmPlacement?.()}
                  onCancel={onClose}
                  colors={colors}
                />
              ) : (
                <>
                  <MediumBodyContent
                    spot={spot}
                    hasDesc={hasDesc}
                    hasCover={hasCover}
                    isSaved={isSaved}
                    isVisited={isVisited}
                    isDraft={isDraft}
                    colors={colors}
                    colorScheme={colorScheme}
                    handleToggleSaved={handleToggleSaved}
                    handleToggleVisited={handleToggleVisited}
                  />
                  {isDraft ? (
                    <DraftInlineEditor
                      draftCoverUri={draftCoverUri}
                      onDraftCoverChange={onDraftCoverChange}
                      onCreateSpot={onCreateSpot}
                      colors={colors}
                      colorScheme={colorScheme ?? "light"}
                    />
                  ) : (
                    <ExpandedExtra
                      distanceKmVal={distanceKmVal}
                      whyText={whyText}
                      addressText={addressText}
                      isAuthUser={isAuthUser}
                      colors={colors}
                      handleDirections={handleDirections}
                      handleEdit={handleEdit}
                      onEdit={onEdit}
                    />
                  )}
                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.bodyContentWrap}>
            <View style={styles.bodyContentInner} onLayout={onFullBodyLayout}>
              {isDraft && isPlacingDraftSpot ? (
                <PlacingDraftContent
                  onConfirm={() => onConfirmPlacement?.()}
                  onCancel={onClose}
                  colors={colors}
                />
              ) : (
                <>
                  <MediumBodyContent
                    spot={spot}
                    hasDesc={hasDesc}
                    hasCover={hasCover}
                    isSaved={isSaved}
                    isVisited={isVisited}
                    isDraft={isDraft}
                    colors={colors}
                    colorScheme={colorScheme}
                    handleToggleSaved={handleToggleSaved}
                    handleToggleVisited={handleToggleVisited}
                  />
                  {isDraft ? (
                    <DraftInlineEditor
                      draftCoverUri={draftCoverUri}
                      onDraftCoverChange={onDraftCoverChange}
                      onCreateSpot={onCreateSpot}
                      colors={colors}
                      colorScheme={colorScheme ?? "light"}
                    />
                  ) : (
                    <ExpandedExtra
                      distanceKmVal={distanceKmVal}
                      whyText={whyText}
                      addressText={addressText}
                      isAuthUser={isAuthUser}
                      colors={colors}
                      handleDirections={handleDirections}
                      handleEdit={handleEdit}
                      onEdit={onEdit}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        )
      ) : null}

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
}

const HEADER_PADDING_V = 12;
const HEADER_PADDING_H = 14;
const BODY_PADDING_H = 14;

const styles = StyleSheet.create({
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
    zIndex: 8,
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
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
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
  },
  bodyContentWrap: {
    paddingHorizontal: BODY_PADDING_H,
    paddingBottom: 16,
    rowGap: BODY_ROW_GAP,
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
    height: COVER_HEIGHT,
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
