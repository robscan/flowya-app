import { CountriesMapPreview } from "@/components/explorar/CountriesMapPreview";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { SpotSheetHeader } from "@/components/explorar/spot-sheet/SpotSheetHeader";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  TRAVELER_LEVELS,
  computeTravelerPoints,
  formatTravelerLevelPointsRange,
  resolveTravelerLevelByPoints,
} from "@/lib/traveler-levels";
import { List, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
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

import {
  getSheetHeightForState,
  resolveNextSheetStateFromGesture,
} from "@/components/explorar/spot-sheet/sheet-logic";

export type CountriesSheetState = "peek" | "medium" | "expanded";

export type CountrySheetItem = {
  key: string;
  label: string;
  count: number;
};

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
}: CountriesSheetProps) {
  const insets = useSafeAreaInsets();
  const deviceColorScheme = useColorScheme();
  const activeScheme = forceColorScheme ?? (deviceColorScheme === "dark" ? "dark" : "light");
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

  const [headerHeight, setHeaderHeight] = useState(SHEET_PEEK_HEIGHT);
  const [dragAreaHeight, setDragAreaHeight] = useState(0);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [levelsViewportHeight, setLevelsViewportHeight] = useState(0);
  const [levelsContentHeight, setLevelsContentHeight] = useState(0);

  const collapsedFromMeasure =
    dragAreaHeight > 0
      ? HEADER_PADDING_V + dragAreaHeight
      : headerHeight > 0 && headerHeight < 90
        ? HEADER_PADDING_V + HANDLE_ROW_ESTIMATE + headerHeight
        : 0;
  const collapsedAnchor = collapsedFromMeasure > 0 ? collapsedFromMeasure : SHEET_PEEK_HEIGHT;
  const mediumAnchor = Math.round(viewportHeight * SHEET_MEDIUM_RATIO);
  const expandedAnchor = viewportHeight;

  const mediumBaselineHeight =
    collapsedAnchor +
    summaryHeight +
    MAP_PREVIEW_BLOCK_HEIGHT +
    (filterMode === "visited" ? PROGRESS_BLOCK_HEIGHT : 0) +
    CONTAINER_PADDING_BOTTOM;
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

  if (!visible) return null;

  const visibleHeightForState = getSheetHeightForState(
    state,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
  );
  const maxBodyHeight = Math.max(
    0,
    visibleHeightForState - collapsedAnchor - summaryHeight - CONTAINER_PADDING_BOTTOM,
  );
  const maxListHeight = Math.max(
    0,
    maxBodyHeight - MAP_PREVIEW_BLOCK_HEIGHT - (filterMode === "visited" ? PROGRESS_BLOCK_HEIGHT : 0),
  );
  const showExpandedList = state === "expanded";
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
  const isLevelsScrollable = levelsViewportHeight > 0 && levelsContentHeight > levelsViewportHeight + 2;

  return (
    <Animated.View
      pointerEvents="box-none"
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
        <SpotSheetHeader
          isDraft={false}
          isPlacingDraftSpot={false}
          isPoiMode={false}
          poiLoading={false}
          displayTitle={title}
          state={state}
          colors={colors}
          onHeaderTap={handleHeaderTap}
          onShare={onShare}
          shareDisabled={shareDisabled}
          onClose={onClose}
          onDragAreaLayout={onDragAreaLayout}
          onHeaderLayout={onHeaderLayout}
        />
      </GestureDetector>

      <View
        style={styles.summaryWrap}
        onLayout={(event) => setSummaryHeight(Math.round(event.nativeEvent.layout.height))}
      >
        <Pressable
          onPress={onCountriesKpiPress}
          disabled={onCountriesKpiPress == null}
          style={({ pressed }) => [
            styles.summaryChip,
            pressed && onCountriesKpiPress != null ? styles.summaryChipPressed : null,
          ]}
          accessibilityRole={onCountriesKpiPress ? "button" : undefined}
          accessibilityLabel={onCountriesKpiPress ? "Ver lista completa de países" : undefined}
        >
          <Text style={[styles.summaryValue, { color: colors.text }]}>{summaryCountriesCount}</Text>
          <View style={styles.kpiLabelRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>países</Text>
            {onCountriesKpiPress && state !== "expanded" ? (
              <List size={14} color={colors.primary} strokeWidth={2.2} />
            ) : null}
          </View>
        </Pressable>
        <Pressable
          onPress={onSpotsKpiPress}
          disabled={onSpotsKpiPress == null}
          style={({ pressed }) => [
            styles.summaryChip,
            pressed && onSpotsKpiPress != null ? styles.summaryChipPressed : null,
          ]}
          accessibilityRole={onSpotsKpiPress ? "button" : undefined}
          accessibilityLabel={onSpotsKpiPress ? "Abrir buscador con spots del filtro" : undefined}
        >
          <Text style={[styles.summaryValue, { color: colors.text }]}>{summaryPlacesCount}</Text>
          <View style={styles.kpiLabelRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>spots</Text>
            {onSpotsKpiPress ? (
              <List size={14} color={colors.primary} strokeWidth={2.2} />
            ) : null}
          </View>
        </Pressable>
        <View style={styles.summaryChip}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {pointsLabel}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {filterMode === "visited" ? "flows" : "flows por obtener"}
          </Text>
        </View>
      </View>

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
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${normalizedWorldPercentage}%`,
                  backgroundColor: colors.stateSuccess,
                },
              ]}
            />
          </View>
          <View style={styles.progressMetaRow}>
            <Text style={[styles.progressCopy, { color: colors.textSecondary }]}>
              Nivel: <Text style={[styles.progressCopyLevelName, { color: colors.text }]}>{currentTravelerLevel.label}</Text>
            </Text>
            <Pressable
              onPress={() => setShowLevelsModal(true)}
              style={({ pressed }) => [styles.progressLevelButton, pressed ? styles.progressLevelButtonPressed : null]}
              accessibilityRole="button"
              accessibilityLabel={`Ver niveles de exploración. Nivel actual ${currentTravelerLevel.level} de ${TRAVELER_LEVELS.length} con ${currentTravelerPoints} flows`}
            >
              <Text style={[styles.progressLevelButtonText, { color: colors.textSecondary }]}>{`${currentTravelerLevel.level}/${TRAVELER_LEVELS.length}`}</Text>
              <List size={14} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {!showExpandedList ? null : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyLabel}</Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.listScroll, { maxHeight: expandedListMaxHeight }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        >
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => onItemPress(item)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Buscar en ${item.label}`}
            >
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                <View style={styles.itemRight}>
                <Text style={[styles.itemCount, { color: colors.textSecondary }]}>{`${item.count} spots`}</Text>
                <List size={14} color={colors.primary} strokeWidth={2.2} />
                </View>
              </Pressable>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={showLevelsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelsModal(false)}
      >
        <View style={styles.levelsModalBackdrop}>
          <Pressable style={styles.levelsModalDismiss} onPress={() => setShowLevelsModal(false)} />
          <View
            style={[
              styles.levelsModalCard,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.levelsModalHeader}>
              <Text style={[styles.levelsModalTitle, { color: colors.text }]}>Niveles de exploración</Text>
              <Pressable
                onPress={() => setShowLevelsModal(false)}
                style={({ pressed }) => [
                  styles.levelsModalCloseButton,
                  { backgroundColor: colors.background },
                  pressed ? styles.levelsModalCloseButtonPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar niveles de exploración"
              >
                <X size={20} color={colors.text} strokeWidth={2.2} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.levelsList}
              contentContainerStyle={styles.levelsListContent}
              onLayout={(event) => setLevelsViewportHeight(Math.round(event.nativeEvent.layout.height))}
              onContentSizeChange={(_, h) => setLevelsContentHeight(Math.round(h))}
              scrollEnabled={isLevelsScrollable}
              showsVerticalScrollIndicator={isLevelsScrollable}
            >
              {TRAVELER_LEVELS.map((level) => {
                const isCurrent = level.level === currentTravelerLevel.level;
                return (
                  <View
                    key={level.level}
                    style={[
                      styles.levelRow,
                      {
                        backgroundColor: isCurrent ? colors.background : "transparent",
                      },
                    ]}
                  >
                    <Text style={[styles.levelRowTitle, { color: isCurrent ? colors.text : colors.textSecondary }]}>
                      {`Nivel ${level.level}: ${level.label}`}
                    </Text>
                    <Text style={[styles.levelRowRange, { color: colors.textSecondary }]}>
                      {formatTravelerLevelPointsRange(level)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  summaryWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  summaryChip: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressCopy: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400",
  },
  progressCopyLevelName: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  progressMetaRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressLevelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  progressLevelButtonPressed: {
    opacity: 0.72,
  },
  progressLevelButtonText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  summaryChipPressed: {
    opacity: 0.82,
  },
  kpiLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  summaryValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  mapPreviewWrap: {
    height: MAP_PREVIEW_HEIGHT,
    borderRadius: Radius.lg,
    marginHorizontal: 0,
    marginTop: MAP_PREVIEW_TOP_GAP,
    overflow: "hidden",
  },
  progressWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  levelsModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
  },
  levelsModalDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  levelsModalCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "72%",
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  levelsModalHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  levelsModalTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    flex: 1,
  },
  levelsModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  levelsModalCloseButtonPressed: {
    opacity: 0.72,
  },
  levelsList: {
    width: "100%",
  },
  levelsListContent: {
    paddingHorizontal: 0,
    paddingBottom: Spacing.base,
    gap: 0,
  },
  levelRow: {
    minHeight: 44,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  levelRowTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    flex: 1,
  },
  levelRowRange: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    minWidth: 92,
    textAlign: "right",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listScroll: {
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  item: {
    minHeight: 44,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  itemPressed: {
    opacity: 0.72,
  },
  itemLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    flex: 1,
  },
  itemCount: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    minWidth: 64,
    textAlign: "right",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 88,
    justifyContent: "flex-end",
  },
});
