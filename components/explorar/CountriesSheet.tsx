import { CountriesMapPreview } from "@/components/design-system/countries-map-preview";
import { CountriesSheetCountryList } from "@/components/design-system/countries-sheet-country-list";
import { CountriesSheetKpiRow } from "@/components/design-system/countries-sheet-kpi-row";
import { CountriesSheetVisitedProgress } from "@/components/design-system/countries-sheet-visited-progress";
import type { SearchResultCardProps } from "@/components/design-system/search-result-card";
import type {
  CountriesSheetListDetail,
  CountriesSheetState,
  CountrySheetItem,
} from "@/components/design-system/countries-sheet-types";
import { SearchLauncherField } from "@/components/design-system/search-launcher-field";
import { TravelerLevelsModal } from "@/components/design-system/traveler-levels-modal";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { SpotSheetHeader } from "@/components/explorar/spot-sheet/SpotSheetHeader";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { computeTravelerPoints, resolveTravelerLevelByPoints } from "@/lib/traveler-levels";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Dimensions,
  FlatList,
  SectionList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
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

import {
  getSheetHeightForState,
  resolveNextSheetStateFromGesture,
} from "@/components/explorar/spot-sheet/sheet-logic";

export type {
  CountriesSheetListDetail,
  CountriesSheetState,
  CountrySheetItem,
} from "@/components/design-system/countries-sheet-types";

type CountriesSheetProps = {
  visible: boolean;
  title: string;
  filterMode: "saved" | "visited";
  state: CountriesSheetState;
  forceColorScheme?: "light" | "dark";
  items: CountrySheetItem[];
  worldPercentage: number;
  summaryCountriesCount: number;
  summaryPlacesCount: number;
  onCountriesKpiPress?: () => void;
  onSpotsKpiPress?: () => void;
  /** Entry point a búsqueda (preserva estado del sheet en el host). */
  onSearchPress?: () => void;
  emptyLabel?: string;
  onStateChange: (next: CountriesSheetState) => void;
  onClose: () => void;
  onShare: () => void;
  shareDisabled?: boolean;
  onItemPress: (item: CountrySheetItem) => void;
  onSheetHeightChange?: (height: number) => void;
  onMapSnapshotChange?: (dataUrl: string | null) => void;
  onMapCountryPress?: (
    countryCode: string,
    bounds: [[number, number], [number, number]],
  ) => void;
  countryDetail?: CountriesSheetListDetail | null;
  onCountryDetailBack?: () => void;
  countryDetailSpots?: SearchResultCardProps["spot"][];
  /** Si el host la define, mismo criterio que el buscador (zona vs mapa o bloque único). */
  countryDetailSpotSections?: { id: string; title: string; items: SearchResultCardProps["spot"][] }[] | null;
  renderCountryDetailItem?: (spot: SearchResultCardProps["spot"]) => React.ReactNode;
  /** Barra «Filtros» + chips activos; el panel completo lo monta el host (`ExplorePlacesFiltersModal`). */
  placesListFilterBar?: React.ReactNode;
  /**
   * Si es true y hay `placesListFilterBar`, el buscador del header del sheet va **dentro** de esa barra
   * (fila única con truncado); no se renderiza el `SearchLauncherField` suelto arriba.
   */
  placesListFilterBarEmbedsSheetSearch?: boolean;
  /** Para animación de entrada de lista (sincronizado con filtro de etiqueta en el host). */
  /** Firma estable del filtro de etiquetas (p. ej. ids ordenados) para animación de lista. */
  countryDetailTagFilterSignature?: string | null;
  /** Web ≥1080: panel en columna izquierda; el host lo coloca MapScreen. */
  webDesktopSidebar?: boolean;
  /** Ancho máx. del panel en sidebar desktop (p. ej. más ancho solo en listado de lugares). */
  webDesktopSidebarPanelWidth?: number;
};

const SHEET_PEEK_HEIGHT = 96;
const SHEET_MEDIUM_RATIO = 0.6;
const MIN_MAP_VISIBLE_TOP = 100;
const CONTAINER_PADDING_BOTTOM = 16;
const VELOCITY_SNAP_THRESHOLD = 400;
const SNAP_POSITION_THRESHOLD = 0.25;
const HEADER_PADDING_V = 12;
const HANDLE_ROW_ESTIMATE = 20;
const DURATION_PROGRAMMATIC = 300;
const EASING_SHEET = Easing.bezier(0.4, 0, 0.2, 1);
/** Mini-mapa países: un poco más alto para mejor lectura; el preview web rellena el ancho del wrap. */
const MAP_PREVIEW_HEIGHT = 176;
const MAP_PREVIEW_TOP_GAP = Spacing.md;
const MAP_PREVIEW_BLOCK_HEIGHT = MAP_PREVIEW_HEIGHT + MAP_PREVIEW_TOP_GAP + 12;
const PROGRESS_BLOCK_HEIGHT = 62;
/** Fila chips + gap + fila entrada (botón primario ± buscador inline) en sheet lugares. */
const DETAIL_TAG_ROW_HEIGHT = 108;
const DETAIL_LIST_MIN_HEIGHT = 240;
/** Entrada de listas (países / lugares) en medium o expanded: fade + slide suave. */
const LIST_ENTRANCE_MS = 300;

export function CountriesSheet({
  visible,
  title,
  filterMode,
  state,
  forceColorScheme,
  items,
  worldPercentage,
  summaryCountriesCount,
  summaryPlacesCount,
  onCountriesKpiPress,
  onSpotsKpiPress,
  onSearchPress,
  emptyLabel = "No hay países detectados por ahora.",
  onStateChange,
  onClose,
  onShare,
  shareDisabled = false,
  onItemPress,
  onSheetHeightChange,
  onMapSnapshotChange,
  onMapCountryPress,
  countryDetail = null,
  onCountryDetailBack,
  countryDetailSpots = [],
  countryDetailSpotSections = null,
  renderCountryDetailItem,
  placesListFilterBar,
  placesListFilterBarEmbedsSheetSearch = false,
  countryDetailTagFilterSignature = null,
  webDesktopSidebar = false,
  webDesktopSidebarPanelWidth = WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
}: CountriesSheetProps) {
  const insets = useSafeAreaInsets();
  const deviceColorScheme = useColorScheme();
  const activeScheme = forceColorScheme ?? (deviceColorScheme === "dark" ? "dark" : "light");
  /** Vista resumen de países: título del host. Listado de lugares: título fijo «Lugares»; el ámbito país/Todos va en la fila inferior. */
  const listViewHeaderTitle = useMemo(() => {
    if (countryDetail?.kind === "all_places" || countryDetail?.kind === "country") {
      const n = countryDetailSpots.length;
      return n > 0 ? `Lugares (${n})` : "Lugares";
    }
    return title;
  }, [countryDetail, title, countryDetailSpots.length]);

  const colors = useMemo(() => {
    const base = Colors[activeScheme];
    const panelOverrides =
      filterMode === "saved"
        ? {
            background: base.countriesPanelToVisitBackground,
            backgroundElevated: base.countriesPanelToVisitBackgroundElevated,
            border: base.countriesPanelToVisitBorder,
            borderSubtle: base.countriesPanelToVisitBorderSubtle,
          }
        : {
            background: base.countriesPanelVisitedBackground,
            backgroundElevated: base.countriesPanelVisitedBackgroundElevated,
            border: base.countriesPanelVisitedBorder,
            borderSubtle: base.countriesPanelVisitedBorderSubtle,
          };
    return {
      ...base,
      ...panelOverrides,
    };
  }, [activeScheme, filterMode]);
  const viewportHeight = Dimensions.get("window").height;
  const { width: windowWidth } = useWindowDimensions();
  const useWebConstrainedSheet =
    Platform.OS === "web" &&
    webSearchUsesConstrainedPanelWidth(windowWidth) &&
    !webDesktopSidebar;

  const [headerHeight, setHeaderHeight] = useState(SHEET_PEEK_HEIGHT);
  const [dragAreaHeight, setDragAreaHeight] = useState(0);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const isCountryDetailMode = countryDetail != null;

  useEffect(() => {
    if (countryDetail != null) setSummaryHeight(0);
  }, [countryDetail]);

  const collapsedFromMeasure =
    dragAreaHeight > 0
      ? HEADER_PADDING_V + dragAreaHeight
      : headerHeight > 0 && headerHeight < 90
        ? HEADER_PADDING_V + HANDLE_ROW_ESTIMATE + headerHeight
        : 0;
  const collapsedAnchor = collapsedFromMeasure > 0 ? collapsedFromMeasure : SHEET_PEEK_HEIGHT;
  const mediumAnchor = Math.round(viewportHeight * SHEET_MEDIUM_RATIO);
  const expandedAnchor = viewportHeight;

  const listMediumBaseline =
    collapsedAnchor +
    summaryHeight +
    MAP_PREVIEW_BLOCK_HEIGHT +
    (filterMode === "visited" ? PROGRESS_BLOCK_HEIGHT : 0) +
    CONTAINER_PADDING_BOTTOM;
  const countryDetailMediumBaseline =
    collapsedAnchor +
    (placesListFilterBar != null ? DETAIL_TAG_ROW_HEIGHT : 0) +
    DETAIL_LIST_MIN_HEIGHT +
    CONTAINER_PADDING_BOTTOM;
  const mediumBaselineHeight = isCountryDetailMode ? countryDetailMediumBaseline : listMediumBaseline;
  const mediumVisible = Math.min(mediumAnchor, mediumBaselineHeight);
  const expandedVisibleLimit = Math.max(
    collapsedAnchor + 120,
    viewportHeight - (insets.top + MIN_MAP_VISIBLE_TOP),
  );
  const expandedVisible = expandedVisibleLimit;

  const translateYToAnchor = useCallback(
    (next: CountriesSheetState) => {
      if (next === "expanded") return expandedAnchor - expandedVisible;
      if (next === "medium") return expandedAnchor - mediumVisible;
      return expandedAnchor - collapsedAnchor;
    },
    [expandedAnchor, expandedVisible, mediumVisible, collapsedAnchor],
  );

  const isMeasured = dragAreaHeight > 0;

  const translateYShared = useSharedValue(viewportHeight);
  const opacityShared = useSharedValue(0);
  const expandedAnchorSV = useSharedValue(expandedAnchor);
  const mediumVisibleSV = useSharedValue(mediumVisible);
  const expandedVisibleSV = useSharedValue(expandedVisible);
  const collapsedAnchorSV = useSharedValue(collapsedAnchor);
  const dragStartTranslateYSV = useSharedValue(0);
  const mountedRef = useRef(false);
  const isDraggingRef = useRef(false);

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

  useEffect(() => {
    if (!visible) {
      mountedRef.current = false;
      translateYShared.value = viewportHeight;
      opacityShared.value = 0;
      onSheetHeightChange?.(0);
      return;
    }
    if (webDesktopSidebar) {
      const target = translateYToAnchor("expanded");
      mountedRef.current = true;
      translateYShared.value = target;
      opacityShared.value = 1;
      onSheetHeightChange?.(
        getSheetHeightForState("expanded", collapsedAnchor, mediumVisible, expandedVisible),
      );
      return;
    }
    if (!isMeasured) return;
    const target = translateYToAnchor(state);
    if (!mountedRef.current) {
      mountedRef.current = true;
      translateYShared.value = withTiming(target, { duration: DURATION_PROGRAMMATIC, easing: EASING_SHEET });
      opacityShared.value = withTiming(1, { duration: DURATION_PROGRAMMATIC, easing: EASING_SHEET });
      return;
    }
    if (isDraggingRef.current) return;
    translateYShared.value = withTiming(target, { duration: DURATION_PROGRAMMATIC, easing: EASING_SHEET });
  }, [
    visible,
    isMeasured,
    state,
    translateYToAnchor,
    translateYShared,
    opacityShared,
    viewportHeight,
    onSheetHeightChange,
    webDesktopSidebar,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
  ]);

  useEffect(() => {
    if (!visible) return;
    const next = getSheetHeightForState(state, collapsedAnchor, mediumVisible, expandedVisible);
    onSheetHeightChange?.(next);
  }, [visible, state, collapsedAnchor, mediumVisible, expandedVisible, onSheetHeightChange]);

  const setDraggingTrue = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onSnapEnd = useCallback(
    (next: CountriesSheetState) => {
      isDraggingRef.current = false;
      onStateChange(next);
      const height = getSheetHeightForState(
        next,
        collapsedAnchor,
        mediumVisible,
        expandedVisible,
      );
      onSheetHeightChange?.(height);
    },
    [onStateChange, onSheetHeightChange, collapsedAnchor, mediumVisible, expandedVisible],
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
      const visibleHeight = exp - translateYShared.value;
      const next = resolveNextSheetStateFromGesture({
        visible: visibleHeight,
        velocityY: e.velocityY,
        collapsedAnchor: col,
        mediumVisible: medVis,
        expandedVisible: expVis,
        velocitySnapThreshold: VELOCITY_SNAP_THRESHOLD,
        snapPositionThreshold: SNAP_POSITION_THRESHOLD,
      });
      const targetTy = next === "expanded" ? exp - expVis : next === "medium" ? exp - medVis : exp - col;
      translateYShared.value = withTiming(
        targetTy,
        { duration: DURATION_PROGRAMMATIC, easing: EASING_SHEET },
        (finished) => {
          if (finished) runOnJS(onSnapEnd)(next);
        },
      );
    });

  const handleHeaderTap = useCallback(() => {
    const next = state === "peek" ? "medium" : state === "medium" ? "expanded" : "medium";
    onStateChange(next);
  }, [state, onStateChange]);

  const onDragAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const height = Math.round(e.nativeEvent.layout.height);
    if (height > 0) setDragAreaHeight(height);
  }, []);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const height = Math.round(e.nativeEvent.layout.height);
    if (height > 0) setHeaderHeight(height);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacityShared.value,
    transform: [{ translateY: translateYShared.value }],
  }));

  const listEntranceOpacity = useSharedValue(1);
  const listEntranceTranslateY = useSharedValue(0);

  const listEntranceKey = useMemo(() => {
    const st = webDesktopSidebar ? "expanded" : state;
    if (!visible || (st !== "medium" && st !== "expanded")) return "";
    if (isCountryDetailMode) {
      if (countryDetail == null) return "";
      const tagSeg = countryDetailTagFilterSignature ?? "none";
      const base =
        countryDetail.kind === "country" ? `d:c:${countryDetail.key}` : "d:all";
      /** `filterMode`: misma animación al recargar por visitar ↔ visitados. Tag: chips. */
      return `${base}:f:${filterMode}:t:${tagSeg}`;
    }
    return `m:f:${filterMode}:n:${items.length}`;
  }, [
    visible,
    state,
    isCountryDetailMode,
    countryDetail,
    filterMode,
    items.length,
    countryDetailTagFilterSignature,
    webDesktopSidebar,
  ]);

  useLayoutEffect(() => {
    if (webDesktopSidebar) {
      listEntranceOpacity.value = 1;
      listEntranceTranslateY.value = 0;
      return;
    }
    if (!visible || !listEntranceKey) {
      listEntranceOpacity.value = 1;
      listEntranceTranslateY.value = 0;
      return;
    }
    listEntranceOpacity.value = 0;
    listEntranceTranslateY.value = 12;
    listEntranceOpacity.value = withTiming(1, {
      duration: LIST_ENTRANCE_MS,
      easing: Easing.out(Easing.cubic),
    });
    listEntranceTranslateY.value = withTiming(0, {
      duration: LIST_ENTRANCE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, listEntranceKey, webDesktopSidebar]);

  const listEntranceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listEntranceOpacity.value,
    transform: [{ translateY: listEntranceTranslateY.value }],
  }));

  if (!visible) return null;

  const layoutState = webDesktopSidebar ? "expanded" : state;

  const visibleHeightForState = getSheetHeightForState(
    layoutState,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
  );
  const tagDetailGap =
    isCountryDetailMode && placesListFilterBar != null ? DETAIL_TAG_ROW_HEIGHT + Spacing.sm : 0;
  const maxBodyHeight = isCountryDetailMode
    ? Math.max(
        0,
        visibleHeightForState - collapsedAnchor - tagDetailGap - CONTAINER_PADDING_BOTTOM,
      )
    : Math.max(
        0,
        visibleHeightForState - collapsedAnchor - summaryHeight - CONTAINER_PADDING_BOTTOM,
      );
  const maxListHeight = isCountryDetailMode
    ? Math.max(120, maxBodyHeight)
    : Math.max(
        0,
        maxBodyHeight - MAP_PREVIEW_BLOCK_HEIGHT - (filterMode === "visited" ? PROGRESS_BLOCK_HEIGHT : 0),
      );
  const showPlacesList = layoutState === "medium" || layoutState === "expanded";
  const expandedListMaxHeight = Math.max(120, maxListHeight);
  const bottomOffset = layoutState === "expanded" ? 0 : Math.max(Spacing.md, insets.bottom);
  const previewCountryCodes = items
    .map((item) => item.key.match(/^iso:([A-Z]{2})$/)?.[1] ?? null)
    .filter((code): code is string => code != null);
  const previewHighlightColor =
    filterMode === "saved" ? colors.stateToVisit : colors.stateSuccess;
  const previewBaseCountryColor =
    filterMode === "saved"
      ? colors.countriesMapCountryBaseToVisit
      : colors.countriesMapCountryBaseVisited;
  const previewLineCountryColor =
    filterMode === "saved"
      ? colors.countriesMapCountryLineToVisit
      : colors.countriesMapCountryLineVisited;
  const normalizedWorldPercentage = Math.max(0, Math.min(100, Math.round(worldPercentage)));
  const currentTravelerPoints = computeTravelerPoints(summaryCountriesCount, summaryPlacesCount);
  const currentTravelerLevel = resolveTravelerLevelByPoints(currentTravelerPoints);
  const pointsLabel = new Intl.NumberFormat("es-MX").format(currentTravelerPoints);
  const showStandaloneCountriesSearch =
    onSearchPress != null &&
    !(placesListFilterBarEmbedsSheetSearch && placesListFilterBar != null);
  const sheetAnimated = (
    <Animated.View
      style={[
        styles.container,
        webDesktopSidebar && styles.containerDesktopSidebar,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          height: webDesktopSidebar ? ("100%" as const) : expandedAnchor,
          bottom: webDesktopSidebar ? 0 : useWebConstrainedSheet ? 0 : bottomOffset,
          paddingBottom: Math.max(24, CONTAINER_PADDING_BOTTOM + insets.bottom),
          pointerEvents: "box-none",
        },
        webDesktopSidebar ? null : animatedContainerStyle,
      ]}
    >
      <View style={isCountryDetailMode ? styles.placesScopeHeaderWrap : undefined}>
        {webDesktopSidebar ? (
          <SpotSheetHeader
            isDraft={false}
            isPlacingDraftSpot={false}
            isPoiMode={false}
            poiLoading={false}
            displayTitle={listViewHeaderTitle}
            state={layoutState}
            colors={colors}
            onHeaderTap={handleHeaderTap}
            onShare={onShare}
            shareDisabled={shareDisabled}
            backAction={
              countryDetail != null && onCountryDetailBack != null
                ? { onPress: onCountryDetailBack }
                : undefined
            }
            onClose={onClose}
            onDragAreaLayout={onDragAreaLayout}
            onHeaderLayout={onHeaderLayout}
            hideSheetHandle
          />
        ) : (
          <GestureDetector gesture={panGesture}>
            <SpotSheetHeader
              isDraft={false}
              isPlacingDraftSpot={false}
              isPoiMode={false}
              poiLoading={false}
              displayTitle={listViewHeaderTitle}
              state={state}
              colors={colors}
              onHeaderTap={handleHeaderTap}
              onShare={onShare}
              shareDisabled={shareDisabled}
              backAction={
                countryDetail != null && onCountryDetailBack != null
                  ? { onPress: onCountryDetailBack }
                  : undefined
              }
              onClose={onClose}
              onDragAreaLayout={onDragAreaLayout}
              onHeaderLayout={onHeaderLayout}
            />
          </GestureDetector>
        )}

        {showStandaloneCountriesSearch ? (
          <View style={styles.countriesSearchLauncherWrap} pointerEvents="box-none">
            <SearchLauncherField
              variant="sheet"
              onPress={onSearchPress}
              placeholder="Busca: países, regiones o lugares"
              accessibilityLabel="Abrir búsqueda"
            />
          </View>
        ) : null}
      </View>

      {isCountryDetailMode ? (
        <>
          {placesListFilterBar}
          {!showPlacesList ? null : (
            <Animated.View
              style={[
                styles.listEntranceWrap,
                webDesktopSidebar && styles.listEntranceWrapDesktopSidebar,
                { maxHeight: expandedListMaxHeight },
                listEntranceAnimatedStyle,
              ]}
            >
              {countryDetailSpots.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No hay lugares con este criterio. Prueba a quitar el filtro de etiqueta.
                  </Text>
                </View>
              ) : renderCountryDetailItem != null ? (
                countryDetailSpotSections != null &&
                countryDetailSpotSections.some((s) => s.items.length > 0) ? (
                  <SectionList
                    sections={countryDetailSpotSections
                      .filter((s) => s.items.length > 0)
                      .map((s) => ({ title: s.title, data: s.items }))}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.detailItemWrap}>{renderCountryDetailItem(item)}</View>
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                      <Text
                        style={[styles.placesSectionHeader, { color: colors.textSecondary }]}
                        accessibilityRole="header"
                      >
                        {title}
                      </Text>
                    )}
                    style={[styles.detailPlacesFlatList, { maxHeight: expandedListMaxHeight }]}
                    keyboardShouldPersistTaps="handled"
                    stickySectionHeadersEnabled={false}
                    windowSize={8}
                  />
                ) : (
                  <FlatList
                    data={countryDetailSpots}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.detailItemWrap}>{renderCountryDetailItem(item)}</View>
                    )}
                    style={[styles.detailPlacesFlatList, { maxHeight: expandedListMaxHeight }]}
                    keyboardShouldPersistTaps="handled"
                    windowSize={8}
                  />
                )
              ) : null}
            </Animated.View>
          )}
        </>
      ) : (
        <>
          {placesListFilterBar != null ? (
            <View style={styles.placesFilterBarKpiWrap} pointerEvents="box-none">
              {placesListFilterBar}
            </View>
          ) : null}
          <CountriesSheetKpiRow
            filterMode={filterMode}
            summaryCountriesCount={summaryCountriesCount}
            summaryPlacesCount={summaryPlacesCount}
            pointsLabel={pointsLabel}
            colors={{
              text: colors.text,
              textSecondary: colors.textSecondary,
              primary: colors.primary,
              borderSubtle: colors.borderSubtle,
              background: colors.background,
              backgroundElevated: colors.backgroundElevated,
            }}
            onCountriesKpiPress={showPlacesList ? undefined : onCountriesKpiPress}
            onSpotsKpiPress={onSpotsKpiPress}
            onLayout={(event) => setSummaryHeight(Math.round(event.nativeEvent.layout.height))}
          />

          <View style={styles.mapPreviewWrap}>
            <CountriesMapPreview
              countryCodes={previewCountryCodes}
              height={MAP_PREVIEW_HEIGHT}
              highlightColor={previewHighlightColor}
              forceColorScheme={activeScheme}
              baseCountryColor={previewBaseCountryColor}
              lineCountryColor={previewLineCountryColor}
              onSnapshotChange={onMapSnapshotChange}
              onCountryPress={onMapCountryPress}
            />
          </View>
          {filterMode === "visited" ? (
            <CountriesSheetVisitedProgress
              worldPercentage={normalizedWorldPercentage}
              levelLabel={currentTravelerLevel.label}
              levelIndex={currentTravelerLevel.level}
              currentTravelerPoints={currentTravelerPoints}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                primary: colors.primary,
                borderSubtle: colors.borderSubtle,
                stateSuccess: colors.stateSuccess,
              }}
              onPressLevels={() => setShowLevelsModal(true)}
            />
          ) : null}

          {!showPlacesList ? null : (
            <Animated.View
              style={[
                styles.listEntranceWrap,
                webDesktopSidebar && styles.listEntranceWrapDesktopSidebar,
                { maxHeight: expandedListMaxHeight },
                listEntranceAnimatedStyle,
              ]}
            >
              {items.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyLabel}</Text>
                </View>
              ) : (
                <CountriesSheetCountryList
                  items={items}
                  onItemPress={onItemPress}
                  maxHeight={expandedListMaxHeight}
                  colors={{
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    primary: colors.primary,
                  }}
                />
              )}
            </Animated.View>
          )}
        </>
      )}

      <TravelerLevelsModal
        visible={showLevelsModal}
        onClose={() => setShowLevelsModal(false)}
        currentLevel={currentTravelerLevel}
        colors={{
          text: colors.text,
          textSecondary: colors.textSecondary,
          background: colors.background,
          backgroundElevated: colors.backgroundElevated,
          borderSubtle: colors.borderSubtle,
        }}
      />
    </Animated.View>
  );

  if (webDesktopSidebar) {
    return (
      <View style={styles.webSidebarColumnHost} pointerEvents="box-none">
        <View style={[styles.webSidebarColumnInner, { maxWidth: webDesktopSidebarPanelWidth }]}>
          {sheetAnimated}
        </View>
      </View>
    );
  }

  if (useWebConstrainedSheet) {
    return (
      <View
        style={[
          styles.webSheetWidthHost,
          { bottom: bottomOffset, zIndex: EXPLORE_LAYER_Z.SHEET_BASE },
        ]}
        pointerEvents="box-none"
      >
        <View style={{ width: "100%", maxWidth: WEB_SHEET_MAX_WIDTH }}>{sheetAnimated}</View>
      </View>
    );
  }

  return sheetAnimated;
}

const styles = StyleSheet.create({
  webSidebarColumnHost: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: "100%",
    zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
  },
  webSidebarColumnInner: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: "100%",
  },
  containerDesktopSidebar: {
    top: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    /** `container` usa overflow hidden (sheet móvil); en columna desktop el ancho salta 400↔720 y el hidden recortaba el listado un frame. */
    overflow: "visible",
  },
  webSheetWidthHost: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 12,
    zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
  },
  emptyWrap: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  mapPreviewWrap: {
    height: MAP_PREVIEW_HEIGHT,
    borderRadius: Radius.lg,
    marginHorizontal: 0,
    marginTop: MAP_PREVIEW_TOP_GAP,
    overflow: "hidden",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  /** Banda de filtros de lista: ámbito país justo encima de etiquetas (misma jerarquía mental). */
  placesScopeFiltersBand: {
    position: "relative",
    alignSelf: "stretch",
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    zIndex: EXPLORE_LAYER_Z.SHEET_HEADER_DROPDOWN,
  },
  /**
   * Contenedor de posicionamiento: ancho de la banda del sheet.
   * El menú `absolute` usa left/right respecto a este nodo (lista ancha), no al chip.
   */
  placesScopeDropdownMount: {
    position: "relative",
    alignSelf: "stretch",
    width: "100%",
  },
  /** Chip de ámbito: ancho limitado; el dropdown no hereda este ancho. */
  placesScopeAnchor: {
    position: "relative",
    alignSelf: "flex-start",
    maxWidth: "78%",
    minWidth: 120,
  },
  /** Control compacto tipo chip secundario. */
  placesScopeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 0,
    maxWidth: "100%",
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  placesScopeTriggerValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 18,
    flexShrink: 1,
  },
  placesScopeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: EXPLORE_LAYER_Z.SHEET_PLACES_SCOPE_SCRIM,
  },
  placesScopeHeaderWrap: {
    position: "relative",
    zIndex: EXPLORE_LAYER_Z.SHEET_HEADER_DROPDOWN,
  },
  countriesSearchLauncherWrap: {
    width: "100%",
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: 0,
  },
  /** Misma barra de filtros que en listado Lugares; bajo buscador en vista KPI. */
  placesFilterBarKpiWrap: {
    alignSelf: "stretch",
    width: "100%",
    paddingHorizontal: 0,
    marginBottom: Spacing.xs,
  },
  placesScopeMenuDropWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 0,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  placesScopeMenuDropSurface: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  placesScopeMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  placesScopeMenuRowPressed: {
    opacity: 0.85,
  },
  placesScopeMenuLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    minWidth: 0,
  },
  placesScopeMenuCount: {
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 0,
  },
  placesScopeMenuCheck: {
    fontSize: 16,
    fontWeight: "700",
    width: 22,
    textAlign: "center",
  },
  placesScopeMenuCheckSpacer: {
    width: 22,
  },
  placesScopeMenuRowEnd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  listEntranceWrap: {
    width: "100%",
    overflow: "hidden",
  },
  /** Desktop sidebar: mismo motivo que `containerDesktopSidebar.overflow` — evitar clip al cambiar ancho/panel. */
  listEntranceWrapDesktopSidebar: {
    overflow: "visible",
  },
  detailPlacesFlatList: {
    flexGrow: 0,
    width: "100%",
  },
  detailItemWrap: {
    marginBottom: Spacing.sm,
  },
  /** Alineado a SearchSurface (`sectionHeader`) para paridad buscador ↔ sheet lugares. */
  placesSectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tagFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    maxHeight: DETAIL_TAG_ROW_HEIGHT,
    minHeight: 40,
  },
  /** Con selector de país justo encima: menos aire entre filtros de lista. */
  tagFilterRowTightTop: {
    marginTop: Spacing.xs,
  },
  tagFilterScrollWrap: {
    flex: 1,
    minWidth: 0,
    maxHeight: DETAIL_TAG_ROW_HEIGHT,
  },
  tagFilterScroll: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxHeight: DETAIL_TAG_ROW_HEIGHT,
  },
  tagFilterScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  tagFilterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 220,
  },
  tagFilterChipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 260,
  },
  tagFilterChipMainPress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
  },
  countriesTagFilterIconLabelFill: {
    flex: 1,
    minWidth: 0,
  },
  tagFilterChipRemove: {
    padding: 2,
    marginLeft: 2,
    flexShrink: 0,
  },
  tagFilterDoneBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexShrink: 0,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        cursor: "pointer" as const,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  tagFilterDoneBtnLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  tagFilterChipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
