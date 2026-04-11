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
import { TravelerLevelsModal } from "@/components/design-system/traveler-levels-modal";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { SpotSheetHeader } from "@/components/explorar/spot-sheet/SpotSheetHeader";
import { ChevronDown } from "lucide-react-native";
import { Colors, Elevation, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { computeTravelerPoints, resolveTravelerLevelByPoints } from "@/lib/traveler-levels";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { WEB_SHEET_MAX_WIDTH, webSearchUsesConstrainedPanelWidth } from "@/lib/web-layout";
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
  renderCountryDetailItem?: (spot: SearchResultCardProps["spot"]) => React.ReactNode;
  countryDetailTagFilterOptions?: { id: string; name: string; count: number }[];
  selectedCountryDetailTagFilterId?: string | null;
  onCountryDetailTagFilterChange?: (tagId: string | null) => void;
  /** Listado de lugares: desde el menú del título, volver a `all_places` o cambiar de país. */
  onPlacesListScopeChange?: (next: CountriesSheetListDetail) => void;
  /** Web ≥1080: panel en columna izquierda; el host lo coloca MapScreen. */
  webDesktopSidebar?: boolean;
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
const MAP_PREVIEW_HEIGHT = 172;
const MAP_PREVIEW_TOP_GAP = Spacing.md;
const MAP_PREVIEW_BLOCK_HEIGHT = MAP_PREVIEW_HEIGHT + MAP_PREVIEW_TOP_GAP + 12;
const PROGRESS_BLOCK_HEIGHT = 62;
const DETAIL_TAG_ROW_HEIGHT = 52;
const DETAIL_LIST_MIN_HEIGHT = 240;
const PLACES_SCOPE_MENU_MAX_HEIGHT = 380;
const PLACES_SCOPE_MENU_ENTRANCE_MS = 280;
/** Entrada de listas (países / lugares) en medium o expanded: fade + slide suave. */
const LIST_ENTRANCE_MS = 300;

/** Web: evita selección de texto en chips (alineado a SearchSurface). */
const webTagChipNoSelect =
  Platform.OS === "web"
    ? ({ userSelect: "none", WebkitUserSelect: "none" } as const)
    : null;

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
  renderCountryDetailItem,
  countryDetailTagFilterOptions = [],
  selectedCountryDetailTagFilterId = null,
  onCountryDetailTagFilterChange,
  onPlacesListScopeChange,
  webDesktopSidebar = false,
}: CountriesSheetProps) {
  const insets = useSafeAreaInsets();
  const deviceColorScheme = useColorScheme();
  const activeScheme = forceColorScheme ?? (deviceColorScheme === "dark" ? "dark" : "light");
  const listViewHeaderTitle = useMemo(() => {
    if (countryDetail == null) return title;
    if (countryDetail.kind === "country") return countryDetail.label;
    return "Todos";
  }, [countryDetail, title]);

  const showPlacesScopeDropdown =
    countryDetail?.kind === "all_places" || countryDetail?.kind === "country";

  const handlePlacesScopeSelectTodos = useCallback(() => {
    onPlacesListScopeChange?.({ kind: "all_places" });
    setPlacesScopeMenuOpen(false);
  }, [onPlacesListScopeChange]);

  const handlePlacesScopeSelectCountry = useCallback(
    (item: CountrySheetItem) => {
      onItemPress(item);
      setPlacesScopeMenuOpen(false);
    },
    [onItemPress],
  );

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
  const [placesScopeMenuOpen, setPlacesScopeMenuOpen] = useState(false);

  const isCountryDetailMode = countryDetail != null;
  const showDetailTagRow =
    isCountryDetailMode &&
    countryDetailTagFilterOptions.length > 0 &&
    onCountryDetailTagFilterChange != null;

  useEffect(() => {
    if (countryDetail != null) setSummaryHeight(0);
  }, [countryDetail]);

  useEffect(() => {
    if (!visible || countryDetail == null) {
      setPlacesScopeMenuOpen(false);
    }
  }, [visible, countryDetail]);

  const placesScopeMenuEntrance = useSharedValue(0);
  const placesScopeMenuEntranceAnimatedStyle = useAnimatedStyle(() => {
    const t = placesScopeMenuEntrance.value;
    return {
      opacity: t,
      transform: [{ translateY: (1 - t) * -12 }],
    };
  });

  useEffect(() => {
    if (showPlacesScopeDropdown && placesScopeMenuOpen) {
      placesScopeMenuEntrance.value = 0;
      placesScopeMenuEntrance.value = withTiming(1, {
        duration: PLACES_SCOPE_MENU_ENTRANCE_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [showPlacesScopeDropdown, placesScopeMenuOpen, placesScopeMenuEntrance]);

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
    (showDetailTagRow ? DETAIL_TAG_ROW_HEIGHT : 0) +
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
      const target = translateYToAnchor(state);
      mountedRef.current = true;
      translateYShared.value = withTiming(target, {
        duration: DURATION_PROGRAMMATIC,
        easing: EASING_SHEET,
      });
      opacityShared.value = withTiming(1, {
        duration: DURATION_PROGRAMMATIC,
        easing: EASING_SHEET,
      });
      onSheetHeightChange?.(
        getSheetHeightForState(state, collapsedAnchor, mediumVisible, expandedVisible),
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
    if (!visible || (state !== "medium" && state !== "expanded")) return "";
    if (isCountryDetailMode) {
      if (countryDetail == null) return "";
      const tagSeg = selectedCountryDetailTagFilterId ?? "none";
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
    selectedCountryDetailTagFilterId,
  ]);

  useLayoutEffect(() => {
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
  }, [visible, listEntranceKey]);

  const listEntranceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listEntranceOpacity.value,
    transform: [{ translateY: listEntranceTranslateY.value }],
  }));

  if (!visible) return null;

  const visibleHeightForState = getSheetHeightForState(
    state,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
  );
  const tagDetailGap =
    isCountryDetailMode && showDetailTagRow ? DETAIL_TAG_ROW_HEIGHT + Spacing.sm : 0;
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
  const showPlacesList = state === "medium" || state === "expanded";
  const expandedListMaxHeight = Math.max(120, maxListHeight);
  const bottomOffset = state === "expanded" ? 0 : Math.max(Spacing.md, insets.bottom);
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
        animatedContainerStyle,
      ]}
    >
      {showPlacesScopeDropdown && placesScopeMenuOpen ? (
        <Pressable
          style={styles.placesScopeBackdrop}
          onPress={() => setPlacesScopeMenuOpen(false)}
          accessibilityLabel="Cerrar menú de lugares"
          accessibilityRole="button"
        />
      ) : null}
      <View style={showPlacesScopeDropdown ? styles.placesScopeHeaderWrap : undefined}>
        <GestureDetector gesture={panGesture}>
          <SpotSheetHeader
            isDraft={false}
            isPlacingDraftSpot={false}
            isPoiMode={false}
            poiLoading={false}
            displayTitle={listViewHeaderTitle}
            titleSlot={
              showPlacesScopeDropdown ? (
                <Pressable
                  style={styles.placesScopeTrigger}
                  onPress={() => setPlacesScopeMenuOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    countryDetail?.kind === "country"
                      ? `Lugares: ${countryDetail.label}. Cambiar país o todos`
                      : "Filtrar lugares: Todos o un país"
                  }
                  accessibilityState={{ expanded: placesScopeMenuOpen }}
                >
                  <Text
                    style={[styles.placesScopeTriggerText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {countryDetail?.kind === "country" ? countryDetail.label : "Todos"}
                  </Text>
                  <View
                    style={{
                      transform: [{ rotate: placesScopeMenuOpen ? "180deg" : "0deg" }],
                    }}
                  >
                    <ChevronDown size={20} color={colors.text} strokeWidth={2.2} />
                  </View>
                </Pressable>
              ) : undefined
            }
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

        {showPlacesScopeDropdown && placesScopeMenuOpen ? (
          <Animated.View
            style={[
              styles.placesScopeMenuDropWrap,
              Elevation.card,
              placesScopeMenuEntranceAnimatedStyle,
            ]}
          >
            <View
              style={[
                styles.placesScopeMenuDropSurface,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.backgroundElevated,
                },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                style={{ maxHeight: PLACES_SCOPE_MENU_MAX_HEIGHT }}
              >
                <Pressable
                  onPress={handlePlacesScopeSelectTodos}
                  style={({ pressed }) => [
                    styles.placesScopeMenuRow,
                    pressed && styles.placesScopeMenuRowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Todos los lugares"
                  accessibilityState={{ selected: countryDetail?.kind === "all_places" }}
                >
                  <Text style={[styles.placesScopeMenuLabel, { color: colors.text }]}>Todos</Text>
                  {countryDetail?.kind === "all_places" ? (
                    <Text style={[styles.placesScopeMenuCheck, { color: colors.primary }]}>✓</Text>
                  ) : (
                    <View style={styles.placesScopeMenuCheckSpacer} />
                  )}
                </Pressable>
                {items.map((item) => {
                  const countrySelected =
                    countryDetail?.kind === "country" && countryDetail.key === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => handlePlacesScopeSelectCountry(item)}
                      style={({ pressed }) => [
                        styles.placesScopeMenuRow,
                        pressed && styles.placesScopeMenuRowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label}, ${item.count} lugares`}
                      accessibilityState={{ selected: countrySelected }}
                    >
                      <Text style={[styles.placesScopeMenuLabel, { color: colors.text }]}>{item.label}</Text>
                      <View style={styles.placesScopeMenuRowEnd}>
                        <Text style={[styles.placesScopeMenuCount, { color: colors.textSecondary }]}>
                          {item.count} lugares
                        </Text>
                        {countrySelected ? (
                          <Text style={[styles.placesScopeMenuCheck, { color: colors.primary }]}>✓</Text>
                        ) : (
                          <View style={styles.placesScopeMenuCheckSpacer} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {isCountryDetailMode ? (
        <>
          {showDetailTagRow ? (
            <View style={styles.tagFilterRow}>
              <View style={styles.tagFilterScrollWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews={false}
                  style={[
                    styles.tagFilterScroll,
                    Platform.OS === "web" ? ({ touchAction: "pan-x" } as ViewStyle) : null,
                  ]}
                  contentContainerStyle={styles.tagFilterScrollContent}
                >
                  <Pressable
                    onPress={() => onCountryDetailTagFilterChange?.(null)}
                    style={[
                      styles.tagFilterChip,
                      webTagChipNoSelect,
                      {
                        backgroundColor:
                          selectedCountryDetailTagFilterId == null ? colors.tint : colors.background,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    accessibilityLabel="Sin filtrar por etiqueta"
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedCountryDetailTagFilterId == null }}
                  >
                    <Text
                      style={[
                        styles.tagFilterChipLabel,
                        webTagChipNoSelect,
                        {
                          color:
                            selectedCountryDetailTagFilterId == null ? colors.background : colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      Cualquiera
                    </Text>
                  </Pressable>
                  {countryDetailTagFilterOptions.map((opt) => {
                    const selected = selectedCountryDetailTagFilterId === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => onCountryDetailTagFilterChange?.(selected ? null : opt.id)}
                        style={[
                          styles.tagFilterChip,
                          webTagChipNoSelect,
                          {
                            backgroundColor: selected ? colors.tint : colors.background,
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                        accessibilityLabel={`Filtrar por ${opt.name}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.tagFilterChipLabel,
                            webTagChipNoSelect,
                            { color: selected ? colors.background : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          #{opt.name}
                          {opt.count > 0 ? ` (${opt.count})` : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          ) : null}
          {!showPlacesList ? null : (
            <Animated.View
              style={[
                styles.listEntranceWrap,
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
              ) : null}
            </Animated.View>
          )}
        </>
      ) : (
        <>
          <CountriesSheetKpiRow
            filterMode={filterMode}
            summaryCountriesCount={summaryCountriesCount}
            summaryPlacesCount={summaryPlacesCount}
            pointsLabel={pointsLabel}
            colors={{
              text: colors.text,
              textSecondary: colors.textSecondary,
              primary: colors.primary,
            }}
            sheetState={state}
            onCountriesKpiPress={onCountriesKpiPress}
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
        <View style={styles.webSidebarColumnInner}>{sheetAnimated}</View>
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
    width: "100%",
    zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
  },
  webSidebarColumnInner: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: WEB_SHEET_MAX_WIDTH,
  },
  containerDesktopSidebar: {
    top: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  placesScopeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 0,
    flex: 1,
    paddingVertical: 4,
  },
  placesScopeTriggerText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
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
  detailPlacesFlatList: {
    flexGrow: 0,
    width: "100%",
  },
  detailItemWrap: {
    marginBottom: Spacing.sm,
  },
  tagFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    maxHeight: DETAIL_TAG_ROW_HEIGHT,
    minHeight: 40,
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
  tagFilterChipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
