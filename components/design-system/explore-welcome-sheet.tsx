/**
 * Sheet inicial de Explorar (sin spot/POI): handle + launcher de búsqueda; en medium lista de recomendados.
 * En web default la fila FLOWYA + pastilla va en MapScreen; en sidebar desktop (≥1080) el padre puede colocarla como cabecera del panel.
 */

import {
  SearchResultCard,
  type SearchResultCardProps,
} from "@/components/design-system/search-result-card";
import { SearchListCard } from "@/components/design-system/search-list-card";
import { ExploreSearchActionRow } from "@/components/design-system/explore-search-action-row";
import { SheetHandle } from "@/components/design-system/sheet-handle";
import {
  getSheetHeightForState,
  resolveNextSheetStateFromGesture,
} from "@/components/explorar/spot-sheet/sheet-logic";
import { SHEET_MEDIUM_MAX_BODY } from "@/components/explorar/SpotSheet";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { SpotSheetHeader } from "@/components/explorar/spot-sheet/SpotSheetHeader";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { distanceKm, formatDistanceKm } from "@/lib/geo-utils";
import type { PlaceResult } from "@/lib/places/searchPlaces";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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

export type ExploreWelcomeSheetState = "peek" | "medium" | "expanded";

/** Paridad CountriesSheet: mapa mínimo visible arriba del sheet en expanded. */
const MIN_MAP_VISIBLE_TOP = 100;
const SHEET_MEDIUM_RATIO = 0.52;
/** Título sección + márgenes sobre la lista (estimado). */
const LIST_SECTION_OVERHEAD = 44;
const CONTAINER_PADDING_BOTTOM = 16;
const HEADER_PADDING_V = 12;
const HANDLE_ROW_ESTIMATE = 20;
const VELOCITY_SNAP_THRESHOLD = 400;
const SNAP_POSITION_THRESHOLD = 0.25;
const DURATION_PROGRAMMATIC = 300;
const EASING_SHEET = Easing.bezier(0.4, 0, 0.2, 1);

/** Paridad con MapScreen / SearchFloating: landmark para fila de lugar externo. */
function isPlaceLandmark(place: PlaceResult): boolean {
  const maki = (place.maki ?? "").toLowerCase();
  const ft = (place.featureType ?? "").toLowerCase();
  const cats = (place.categories ?? []).map((c) => String(c).toLowerCase());
  const landmarkTokens = ["landmark", "monument", "museum", "religious", "historic"];
  if (ft.includes("landmark")) return true;
  if (landmarkTokens.some((t) => maki.includes(t))) return true;
  if (cats.some((c) => landmarkTokens.some((t) => c.includes(t)))) return true;
  return false;
}

/** Fila tipo spot en lista (coords requeridas para distancia; resto alineado a SearchResultCard). */
export type WelcomeSpotListRow = SearchResultCardProps["spot"] & {
  latitude: number;
  longitude: number;
};

export type WelcomeBrowseItem = WelcomeSpotListRow | PlaceResult;

export type ExploreWelcomeSheetProps = {
  visible: boolean;
  state: ExploreWelcomeSheetState;
  onStateChange: (next: ExploreWelcomeSheetState) => void;
  onSheetHeightChange?: (height: number) => void;
  onSearchPress: () => void;
  onProfilePress: () => void;
  onLogoutPress?: () => void;
  showLogoutAction?: boolean;
  isAuthUser?: boolean;
  logoutPopoverBottomOffset?: number;
  /** Título de la sección en medium/expanded (listado inferior). */
  browseSectionTitle?: string;
  /** RPC populares, o fallback cold-start alineado a MapScreen (`coldStartWorldRecommendations`). */
  browseItems: WelcomeBrowseItem[];
  onBrowseItemPress: (item: WelcomeBrowseItem) => void;
  userCoords?: { latitude: number; longitude: number } | null;
  bottomOffset: number;
  forceColorScheme?: "light" | "dark";
  /** Web ≥1080: panel fijo en columna izquierda (MapScreen); sin sheet inferior. */
  webExploreLayout?: "default" | "desktopSidebar";
  /** Sidebar desktop: el padre ya renderiza FLOWYA encima; no duplicar padding superior de safe area. */
  desktopSidebarFlowyaHeaderStacked?: boolean;
  /** Sidebar web: cabecera con compartir + cerrar (oculta el panel en MapScreen). */
  onSidebarClose?: () => void;
  onSidebarShare?: () => void;
  /** Título en la cabecera del sidebar (junto a compartir/cerrar). */
  sidebarHeaderTitle?: string;
};

export function ExploreWelcomeSheet({
  visible,
  state,
  onStateChange,
  onSheetHeightChange,
  onSearchPress,
  onProfilePress,
  onLogoutPress,
  showLogoutAction,
  isAuthUser,
  logoutPopoverBottomOffset,
  browseSectionTitle = "Lugares populares en Flowya",
  browseItems,
  onBrowseItemPress,
  userCoords,
  bottomOffset,
  forceColorScheme,
  webExploreLayout = "default",
  desktopSidebarFlowyaHeaderStacked = false,
  onSidebarClose,
  onSidebarShare,
  sidebarHeaderTitle = "Explorar",
}: ExploreWelcomeSheetProps) {
  const insets = useSafeAreaInsets();
  const deviceScheme = useColorScheme();
  const activeScheme = forceColorScheme ?? (deviceScheme === "dark" ? "dark" : "light");
  const colors = Colors[activeScheme];
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopSidebar =
    Platform.OS === "web" && webExploreLayout === "desktopSidebar";
  const useWebConstrainedSheet =
    Platform.OS === "web" &&
    webSearchUsesConstrainedPanelWidth(windowWidth) &&
    !isDesktopSidebar;

  const [headerBlockHeight, setHeaderBlockHeight] = useState(0);
  const viewportHeight = Dimensions.get("window").height;
  /** Misma base que CountriesSheet: panel de animación = alto de ventana. */
  const expandedAnchor = viewportHeight;

  const collapsedAnchor = useMemo(() => {
    if (headerBlockHeight <= 0) return 112;
    return HEADER_PADDING_V + HANDLE_ROW_ESTIMATE + headerBlockHeight + 8;
  }, [headerBlockHeight]);

  const mediumAnchor = Math.round(viewportHeight * SHEET_MEDIUM_RATIO);
  const mediumContentTotal =
    collapsedAnchor + 36 + SHEET_MEDIUM_MAX_BODY + CONTAINER_PADDING_BOTTOM;
  const mediumVisible = Math.min(mediumAnchor, Math.max(mediumContentTotal, collapsedAnchor + 120));
  /** Expanded: casi toda la altura útil (mismo criterio que CountriesSheet). */
  const expandedVisible = Math.max(
    collapsedAnchor + 120,
    viewportHeight - (insets.top + MIN_MAP_VISIBLE_TOP),
  );

  const listScrollMaxHeight = useMemo(() => {
    const visibleH = getSheetHeightForState(
      state,
      collapsedAnchor,
      mediumVisible,
      expandedVisible,
    );
    return Math.max(
      120,
      visibleH -
        collapsedAnchor -
        LIST_SECTION_OVERHEAD -
        CONTAINER_PADDING_BOTTOM,
    );
  }, [state, collapsedAnchor, mediumVisible, expandedVisible]);

  const translateYToAnchor = useCallback(
    (next: ExploreWelcomeSheetState) => {
      if (next === "expanded") return expandedAnchor - expandedVisible;
      if (next === "medium") return expandedAnchor - mediumVisible;
      return expandedAnchor - collapsedAnchor;
    },
    [expandedAnchor, mediumVisible, expandedVisible, collapsedAnchor],
  );

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
    if (headerBlockHeight <= 0) return;
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
    headerBlockHeight,
    state,
    translateYToAnchor,
    translateYShared,
    opacityShared,
    viewportHeight,
  ]);

  useEffect(() => {
    if (!visible || headerBlockHeight <= 0) return;
    const h = getSheetHeightForState(state, collapsedAnchor, mediumVisible, expandedVisible);
    onSheetHeightChange?.(h);
  }, [
    visible,
    state,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
    headerBlockHeight,
    onSheetHeightChange,
  ]);

  const setDraggingTrue = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onSnapEnd = useCallback(
    (next: ExploreWelcomeSheetState) => {
      isDraggingRef.current = false;
      onStateChange(next);
      const h = getSheetHeightForState(next, collapsedAnchor, mediumVisible, expandedVisible);
      onSheetHeightChange?.(h);
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
      translateYShared.value = withTiming(
        targetTy,
        { duration: DURATION_PROGRAMMATIC, easing: EASING_SHEET },
        (finished) => {
          if (finished) runOnJS(onSnapEnd)(nextState);
        },
      );
    });

  const handleHeaderTap = useCallback(() => {
    const next: ExploreWelcomeSheetState =
      state === "peek" ? "medium" : state === "medium" ? "expanded" : "medium";
    const targetTy = translateYToAnchor(next);
    translateYShared.value = withTiming(targetTy, {
      duration: DURATION_PROGRAMMATIC,
      easing: EASING_SHEET,
    });
    onStateChange(next);
    onSheetHeightChange?.(
      getSheetHeightForState(next, collapsedAnchor, mediumVisible, expandedVisible),
    );
  }, [
    state,
    onStateChange,
    onSheetHeightChange,
    translateYToAnchor,
    collapsedAnchor,
    mediumVisible,
    expandedVisible,
    translateYShared,
  ]);

  const onPeekBlockLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setHeaderBlockHeight(h);
  }, []);

  const noopSidebarHeaderLayout = useCallback((_e: LayoutChangeEvent) => {}, []);

  const onSidebarHeaderTap = useCallback(() => {
    // Sidebar fijo: el título no cambia snap (peek/medium/expanded solo aplica al sheet móvil).
  }, []);

  const renderBrowseRow = useCallback(
    (item: WelcomeBrowseItem, index: number) => {
      const distanceText: string | null =
        userCoords != null
          ? (() => {
              if ("lat" in item) {
                const place = item as PlaceResult;
                const km = distanceKm(
                  userCoords.latitude,
                  userCoords.longitude,
                  place.lat,
                  place.lng,
                );
                return formatDistanceKm(km);
              }
              const spot = item as WelcomeSpotListRow;
              const km = distanceKm(
                userCoords.latitude,
                userCoords.longitude,
                spot.latitude,
                spot.longitude,
              );
              return formatDistanceKm(km);
            })()
          : null;
      if (!("lat" in item)) {
        const spot = item as WelcomeSpotListRow;
        return (
          <View key={spot.id} style={styles.cardWrap}>
            <SearchResultCard
              spot={spot as SearchResultCardProps["spot"]}
              onPress={() => onBrowseItemPress(item)}
              distanceText={distanceText}
            />
          </View>
        );
      }
      const place = item as PlaceResult;
      const rowKey = place.id ?? `place-${place.lat}-${place.lng}-${index}`;
      return (
        <View key={rowKey} style={styles.cardWrap}>
          <SearchListCard
            title={place.name}
            subtitle={place.fullName}
            distanceText={distanceText}
            isLandmark={isPlaceLandmark(place)}
            maki={place.maki ?? undefined}
            onPress={() => onBrowseItemPress(place)}
            accessibilityLabel={`Ver: ${place.name}`}
          />
        </View>
      );
    },
    [userCoords, onBrowseItemPress],
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacityShared.value,
    transform: [{ translateY: translateYShared.value }],
  }));

  const sheetAnimated = (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          height: expandedAnchor,
          bottom: useWebConstrainedSheet ? 0 : bottomOffset,
          paddingBottom: Math.max(24, CONTAINER_PADDING_BOTTOM + insets.bottom),
        },
        animatedContainerStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.inner}>
          <View style={styles.handleRow}>
            <SheetHandle onPress={handleHeaderTap} />
          </View>
          <View onLayout={onPeekBlockLayout} style={styles.peekBlock}>
            <ExploreSearchActionRow
              fullWidth
              onSearchPress={onSearchPress}
              onProfilePress={onProfilePress}
              onLogoutPress={onLogoutPress}
              showLogoutAction={showLogoutAction}
              isAuthUser={isAuthUser}
              logoutPopoverBottomOffset={logoutPopoverBottomOffset}
              searchPlaceholder="Busca países o lugares"
              accessibilityLabel="Buscar países o lugares"
              profileAccessibilityLabel="Cuenta"
            />
          </View>
          {state === "medium" || state === "expanded" ? (
            <View style={styles.mediumBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {browseSectionTitle}
              </Text>
              {browseItems.length > 0 ? (
                <ScrollView
                  style={[styles.listScroll, { maxHeight: listScrollMaxHeight }]}
                  contentContainerStyle={styles.listScrollContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {browseItems.map((item, index) => renderBrowseRow(item, index))}
                </ScrollView>
              ) : (
                <Text style={[styles.emptyListHint, { color: colors.textSecondary }]}>
                  No hay sugerencias ahora. Abre el buscador para explorar el mapa.
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </GestureDetector>
    </Animated.View>
  );

  if (!visible) return null;

  if (isDesktopSidebar) {
    const showSidebarChrome =
      onSidebarClose != null && onSidebarShare != null;
    return (
      <View
        style={[
          styles.desktopSidebarRoot,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSubtle,
            paddingTop: desktopSidebarFlowyaHeaderStacked ? Spacing.sm : insets.top + 8,
          },
        ]}
      >
        {showSidebarChrome ? (
          <View style={styles.desktopSidebarHeaderWrap}>
            <SpotSheetHeader
              isDraft={false}
              isPlacingDraftSpot={false}
              isPoiMode={false}
              poiLoading={false}
              displayTitle={sidebarHeaderTitle}
              state={state}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                borderSubtle: colors.borderSubtle,
              }}
              onHeaderTap={onSidebarHeaderTap}
              onShare={onSidebarShare}
              onClose={onSidebarClose}
              onDragAreaLayout={noopSidebarHeaderLayout}
              onHeaderLayout={noopSidebarHeaderLayout}
              hideSheetHandle
            />
          </View>
        ) : null}
        <View onLayout={onPeekBlockLayout} style={styles.peekBlock}>
          <ExploreSearchActionRow
            fullWidth
            onSearchPress={onSearchPress}
            onProfilePress={onProfilePress}
            onLogoutPress={onLogoutPress}
            showLogoutAction={showLogoutAction}
            isAuthUser={isAuthUser}
            logoutPopoverBottomOffset={logoutPopoverBottomOffset}
            searchPlaceholder="Busca países o lugares"
            accessibilityLabel="Buscar países o lugares"
            profileAccessibilityLabel="Cuenta"
          />
        </View>
        <View style={[styles.mediumBlock, styles.desktopSidebarMedium]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {browseSectionTitle}
          </Text>
          {browseItems.length > 0 ? (
            <ScrollView
              style={styles.desktopSidebarListScroll}
              contentContainerStyle={styles.listScrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {browseItems.map((item, index) => renderBrowseRow(item, index))}
            </ScrollView>
          ) : (
            <Text style={[styles.emptyListHint, { color: colors.textSecondary }]}>
              No hay sugerencias ahora. Abre el buscador para explorar el mapa.
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (useWebConstrainedSheet) {
    return (
      <View
        style={[
          styles.webHost,
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
  desktopSidebarHeaderWrap: {
    width: "100%",
    marginBottom: Spacing.sm,
  },
  desktopSidebarRoot: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
  },
  desktopSidebarMedium: {
    flex: 1,
    minHeight: 120,
  },
  desktopSidebarListScroll: {
    flex: 1,
    minHeight: 160,
    width: "100%",
  },
  webHost: {
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
  inner: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  handleRow: {
    alignItems: "center",
    marginBottom: 4,
  },
  peekBlock: {
    width: "100%",
    alignSelf: "stretch",
  },
  mediumBlock: {
    marginTop: Spacing.sm,
    flex: 1,
    minHeight: 120,
    width: "100%",
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  listScroll: {
    flex: 1,
    minHeight: 160,
    width: "100%",
    alignSelf: "stretch",
  },
  listScrollContent: {
    paddingBottom: Spacing.sm,
    flexGrow: 1,
  },
  emptyListHint: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 2,
    paddingVertical: Spacing.sm,
  },
  cardWrap: {
    marginBottom: Spacing.sm,
    width: "100%",
  },
});
