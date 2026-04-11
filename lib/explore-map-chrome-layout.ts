/**
 * Cálculos puros de flags y offsets del chrome / sheets en MapScreen Explore.
 * Ver docs/contracts/EXPLORE_CHROME_SHELL.md.
 */

import type { ExploreWelcomeSheetState } from "@/components/design-system/explore-welcome-sheet";
import { Platform } from "react-native";
import {
  WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  webExploreUsesDesktopSidebar,
  webSearchUsesConstrainedPanelWidth,
} from "@/lib/web-layout";

/** Constantes compartidas con MapScreenVNext (evitar drift). */
export const EXPLORE_MAP_LAYOUT = {
  CONTROLS_OVERLAY_BOTTOM: 20,
  CONTROLS_OVERLAY_RIGHT: 16,
  FILTER_OVERLAY_TOP: 28,
  TOP_OVERLAY_INSET_X: 16,
  TOP_OVERLAY_INSET_Y: 28,
  FILTER_ESTIMATED_HEIGHT: 56,
  BOTTOM_ACTION_ROW_BOTTOM_GUTTER: 16,
  BOTTOM_ACTION_ROW_CLEARANCE: 56,
  FLOWYA_ABOVE_ROW_GAP: 12,
  /** SpotSheet / Countries en peek: aire bajo la fila FLOWYA. */
  FLOWYA_ABOVE_PEEK_SHEET_GAP: 12,
  /** Welcome o CountriesSheet en peek: separación vertical entre el panel y la fila FLOWYA + pastilla. */
  FLOWYA_ABOVE_WELCOME_SHEET_GAP: 22,
  FLOWYA_STATUS_ROW_HEIGHT_ESTIMATE: 48,
  MAP_CONTROLS_CLEARANCE_ABOVE_FLOWYA_ROW: 10,
  THUMB_FRIENDLY_CENTER_BIAS: 56,
  FILTER_TRIGGER_ESTIMATED_HEIGHT: 56,
} as const;

export type ExploreMapChromeLayoutInput = {
  windowWidth: number;
  windowHeight: number;
  insets: { top: number; left: number; right: number; bottom: number };
  dockBottomOffset: number;
  pinFilter: "all" | "saved" | "visited";
  createSpotNameOverlayOpen: boolean;
  searchV2Open: boolean;
  countriesSheetOpen: boolean;
  selectedSpot: unknown | null;
  poiTapped: unknown | null;
  isGlobeEntryMotionSettled: boolean;
  sheetState: "peek" | "medium" | "expanded";
  countriesSheetState: "peek" | "medium" | "expanded";
  sheetHeight: number;
  countriesSheetHeight: number;
  welcomeSheetHeight: number;
  welcomeSheetState: ExploreWelcomeSheetState;
};

export type ExploreMapChromeLayoutResult = {
  webConstrainedFlowyaLayout: boolean;
  kpiFilterBottomLayout: boolean;
  topFiltersAvailableWidth: number;
  isSpotSheetVisible: boolean;
  isCountriesSheetVisible: boolean;
  showExploreWelcomeSheet: boolean;
  isShellBlockedByOverlay: boolean;
  isBottomActionRowVisible: boolean;
  areMapControlsVisible: boolean;
  isFlowyaFeedbackVisible: boolean;
  logoutPopoverBottomOffset: number;
  filterAnchorSheetHeight: number;
  filterDefaultTop: number;
  filterTop: number;
  filterMinimumTop: number;
  sloganTop: number;
  bottomActionRowBottomOffset: number;
  flowyaBottomOffset: number;
  controlsBottomOffsetBase: number;
  mapControlsLiftAboveFlowyaStatusRow: number;
  controlsBottomOffset: number;
  shouldUseCenteredOverlayColumn: boolean;
  shouldCenterCountriesWithPeekSheet: boolean;
  /** Web ≥1080: welcome o países en columna izquierda; mapa solo en el resto. */
  exploreDesktopSidebarActive: boolean;
  /** Ancho útil del escenario mapa (overlays, filtros). */
  mapStageWidth: number;
  /** Fila FLOWYA: ancho completo del map stage (sin tope 720 centrado). */
  flowyaRowFullMapStageWidth: boolean;
  /** Web sidebar desktop: FLOWYA + pastilla en cabecera del panel, no sobre el mapa. */
  isFlowyaSidebarHeaderVisible: boolean;
  /** Fila FLOWYA anclada al mapa (inferior); falsa cuando va al header del sidebar. */
  isFlowyaStatusRowOnMap: boolean;
};

export function computeExploreMapChromeLayout(
  input: ExploreMapChromeLayoutInput,
): ExploreMapChromeLayoutResult {
  const L = EXPLORE_MAP_LAYOUT;
  const {
    windowWidth,
    windowHeight,
    insets,
    dockBottomOffset,
    pinFilter,
    createSpotNameOverlayOpen,
    searchV2Open,
    countriesSheetOpen,
    selectedSpot,
    poiTapped,
    isGlobeEntryMotionSettled,
    sheetState,
    countriesSheetState,
    sheetHeight,
    countriesSheetHeight,
    welcomeSheetHeight,
    welcomeSheetState,
  } = input;

  const webConstrainedFlowyaLayout =
    Platform.OS === "web" && webSearchUsesConstrainedPanelWidth(windowWidth);
  const kpiFilterBottomLayout = pinFilter === "saved" || pinFilter === "visited";

  const isSpotSheetVisible = selectedSpot != null || poiTapped != null;
  const isCountriesSheetVisible = countriesSheetOpen;
  const showExploreWelcomeSheet =
    !createSpotNameOverlayOpen &&
    !searchV2Open &&
    !countriesSheetOpen &&
    selectedSpot == null &&
    poiTapped == null &&
    pinFilter === "all" &&
    isGlobeEntryMotionSettled;

  const exploreDesktopSidebarActive =
    Platform.OS === "web" &&
    webExploreUsesDesktopSidebar(windowWidth) &&
    (showExploreWelcomeSheet ||
      (isCountriesSheetVisible && (pinFilter === "saved" || pinFilter === "visited")));

  const mapStageWidth = exploreDesktopSidebarActive
    ? Math.max(0, windowWidth - WEB_EXPLORE_SIDEBAR_PANEL_WIDTH)
    : windowWidth;

  const topFiltersAvailableWidth =
    mapStageWidth - insets.left - insets.right - L.TOP_OVERLAY_INSET_X * 2;

  const isShellBlockedByOverlay = createSpotNameOverlayOpen || searchV2Open;

  const isFlowyaSidebarHeaderVisible =
    exploreDesktopSidebarActive &&
    isGlobeEntryMotionSettled &&
    !isShellBlockedByOverlay;

  /** En desktop sidebar la fila no compite con controles del mapa: vive en la columna izquierda. */
  const flowyaRowFullMapStageWidth =
    exploreDesktopSidebarActive && !isFlowyaSidebarHeaderVisible;

  const areMapControlsVisible =
    !isShellBlockedByOverlay &&
    sheetState !== "expanded" &&
    (!isCountriesSheetVisible || countriesSheetState !== "expanded") &&
    (!showExploreWelcomeSheet || welcomeSheetState !== "expanded");

  const isBottomActionRowVisible =
    isGlobeEntryMotionSettled &&
    !isShellBlockedByOverlay &&
    !isSpotSheetVisible &&
    !isCountriesSheetVisible &&
    !showExploreWelcomeSheet;

  /** Contrato documentado: docs/contracts/explore/FLOWYA_STATUS_ROW_VISIBILITY.md */
  const isFlowyaFeedbackVisible =
    isGlobeEntryMotionSettled &&
    !isShellBlockedByOverlay &&
    (!isCountriesSheetVisible || countriesSheetState === "peek") &&
    (!isSpotSheetVisible || sheetState === "peek") &&
    (!showExploreWelcomeSheet || welcomeSheetState === "peek");

  const isFlowyaStatusRowOnMap =
    isFlowyaFeedbackVisible && !isFlowyaSidebarHeaderVisible;

  const logoutPopoverBottomOffset = L.BOTTOM_ACTION_ROW_CLEARANCE + 4;

  const filterDefaultTop = L.FILTER_OVERLAY_TOP + insets.top;
  const filterMinimumTop = insets.top + 4;

  const filterAnchorSheetHeight = isSpotSheetVisible
    ? sheetHeight
    : exploreDesktopSidebarActive && (showExploreWelcomeSheet || isCountriesSheetVisible)
      ? 0
      : showExploreWelcomeSheet
        ? welcomeSheetHeight
        : isCountriesSheetVisible
          ? countriesSheetHeight
          : 0;
  const filterAnchorSheetTop = windowHeight - filterAnchorSheetHeight;
  const filterTop =
    filterAnchorSheetHeight > 0
      ? Math.min(
          filterDefaultTop,
          filterAnchorSheetTop - L.FILTER_ESTIMATED_HEIGHT - 8,
        )
      : filterDefaultTop;

  const sloganTop = Math.max(
    insets.top + L.TOP_OVERLAY_INSET_Y + 40,
    Math.max(filterMinimumTop, filterTop) + L.FILTER_TRIGGER_ESTIMATED_HEIGHT + 48,
  );

  const bottomActionRowBottomOffset = L.BOTTOM_ACTION_ROW_BOTTOM_GUTTER + insets.bottom;

  const flowyaPeekStackGap =
    showExploreWelcomeSheet && welcomeSheetState === "peek"
      ? L.FLOWYA_ABOVE_WELCOME_SHEET_GAP
      : isCountriesSheetVisible && countriesSheetState === "peek"
        ? L.FLOWYA_ABOVE_WELCOME_SHEET_GAP
        : L.FLOWYA_ABOVE_PEEK_SHEET_GAP;

  const flowyaBottomOffset = isSpotSheetVisible
    ? sheetHeight + L.FLOWYA_ABOVE_PEEK_SHEET_GAP
    : exploreDesktopSidebarActive && (showExploreWelcomeSheet || isCountriesSheetVisible)
      ? bottomActionRowBottomOffset +
        L.BOTTOM_ACTION_ROW_CLEARANCE +
        L.FLOWYA_ABOVE_ROW_GAP
      : showExploreWelcomeSheet
        ? welcomeSheetHeight + L.FLOWYA_ABOVE_WELCOME_SHEET_GAP
        : isCountriesSheetVisible
          ? countriesSheetHeight + L.FLOWYA_ABOVE_WELCOME_SHEET_GAP
          : bottomActionRowBottomOffset +
            L.BOTTOM_ACTION_ROW_CLEARANCE +
            L.FLOWYA_ABOVE_ROW_GAP;

  const controlsBottomOffsetBase = isSpotSheetVisible
    ? L.CONTROLS_OVERLAY_BOTTOM + sheetHeight
    : exploreDesktopSidebarActive && isCountriesSheetVisible
      ? dockBottomOffset + insets.bottom
      : exploreDesktopSidebarActive && showExploreWelcomeSheet
        ? dockBottomOffset + insets.bottom
        : isCountriesSheetVisible
          ? L.CONTROLS_OVERLAY_BOTTOM + countriesSheetHeight
          : showExploreWelcomeSheet
            ? L.CONTROLS_OVERLAY_BOTTOM + welcomeSheetHeight
            : dockBottomOffset + insets.bottom;

  const mapControlsLiftAboveFlowyaStatusRow =
    isFlowyaStatusRowOnMap &&
    ((isSpotSheetVisible && sheetState === "peek") ||
      (showExploreWelcomeSheet && welcomeSheetState === "peek") ||
      (isCountriesSheetVisible && countriesSheetState === "peek"))
      ? flowyaPeekStackGap +
        L.FLOWYA_STATUS_ROW_HEIGHT_ESTIMATE +
        L.MAP_CONTROLS_CLEARANCE_ABOVE_FLOWYA_ROW -
        L.CONTROLS_OVERLAY_BOTTOM
      : 0;

  const controlsBottomOffset = controlsBottomOffsetBase + mapControlsLiftAboveFlowyaStatusRow;

  const shouldUseCenteredOverlayColumn =
    !isSpotSheetVisible && !isCountriesSheetVisible && !showExploreWelcomeSheet;

  const shouldCenterCountriesWithPeekSheet =
    !isCountriesSheetVisible &&
    ((isSpotSheetVisible && sheetState === "peek") ||
      (showExploreWelcomeSheet && welcomeSheetState === "peek"));

  return {
    webConstrainedFlowyaLayout,
    kpiFilterBottomLayout,
    topFiltersAvailableWidth,
    isSpotSheetVisible,
    isCountriesSheetVisible,
    showExploreWelcomeSheet,
    isShellBlockedByOverlay,
    isBottomActionRowVisible,
    areMapControlsVisible,
    isFlowyaFeedbackVisible,
    logoutPopoverBottomOffset,
    filterAnchorSheetHeight,
    filterDefaultTop,
    filterTop,
    filterMinimumTop,
    sloganTop,
    bottomActionRowBottomOffset,
    flowyaBottomOffset,
    controlsBottomOffsetBase,
    mapControlsLiftAboveFlowyaStatusRow,
    controlsBottomOffset,
    shouldUseCenteredOverlayColumn,
    shouldCenterCountriesWithPeekSheet,
    exploreDesktopSidebarActive,
    mapStageWidth,
    flowyaRowFullMapStageWidth,
    isFlowyaSidebarHeaderVisible,
    isFlowyaStatusRowOnMap,
  };
}
