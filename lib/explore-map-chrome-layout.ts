/**
 * Cálculos puros de flags y offsets del chrome / sheets en MapScreen Explore.
 * Ver docs/contracts/EXPLORE_CHROME_SHELL.md.
 */

import type { ExploreWelcomeSheetState } from "@/components/design-system/explore-welcome-sheet";
import { Platform } from "react-native";
import { webSearchUsesConstrainedPanelWidth } from "@/lib/web-layout";

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
  FLOWYA_ABOVE_PEEK_SHEET_GAP: 12,
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
  const topFiltersAvailableWidth =
    windowWidth - insets.left - insets.right - L.TOP_OVERLAY_INSET_X * 2;

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

  const isShellBlockedByOverlay = createSpotNameOverlayOpen || searchV2Open;

  const areMapControlsVisible =
    !isShellBlockedByOverlay &&
    sheetState !== "expanded" &&
    (!isCountriesSheetVisible || countriesSheetState !== "expanded") &&
    (!showExploreWelcomeSheet || welcomeSheetState !== "expanded");

  const isBottomActionRowVisible =
    !isShellBlockedByOverlay &&
    !isSpotSheetVisible &&
    !isCountriesSheetVisible &&
    !showExploreWelcomeSheet;

  const isFlowyaFeedbackVisible =
    !isShellBlockedByOverlay &&
    !isCountriesSheetVisible &&
    (!isSpotSheetVisible || sheetState === "peek") &&
    (!showExploreWelcomeSheet || welcomeSheetState === "peek");

  const logoutPopoverBottomOffset = L.BOTTOM_ACTION_ROW_CLEARANCE + 4;

  const filterDefaultTop = L.FILTER_OVERLAY_TOP + insets.top;
  const filterMinimumTop = insets.top + 4;

  const filterAnchorSheetHeight = isSpotSheetVisible
    ? sheetHeight
    : showExploreWelcomeSheet
      ? welcomeSheetHeight
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

  const flowyaBottomOffset = isSpotSheetVisible
    ? sheetHeight + L.FLOWYA_ABOVE_PEEK_SHEET_GAP
    : showExploreWelcomeSheet
      ? welcomeSheetHeight + L.FLOWYA_ABOVE_PEEK_SHEET_GAP
      : bottomActionRowBottomOffset +
        L.BOTTOM_ACTION_ROW_CLEARANCE +
        L.FLOWYA_ABOVE_ROW_GAP;

  const controlsBottomOffsetBase = isSpotSheetVisible
    ? L.CONTROLS_OVERLAY_BOTTOM + sheetHeight
    : isCountriesSheetVisible
      ? L.CONTROLS_OVERLAY_BOTTOM + countriesSheetHeight
      : showExploreWelcomeSheet
        ? L.CONTROLS_OVERLAY_BOTTOM + welcomeSheetHeight
        : dockBottomOffset + insets.bottom;

  const mapControlsLiftAboveFlowyaStatusRow =
    isFlowyaFeedbackVisible &&
    ((isSpotSheetVisible && sheetState === "peek") ||
      (showExploreWelcomeSheet && welcomeSheetState === "peek"))
      ? L.FLOWYA_ABOVE_PEEK_SHEET_GAP +
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
  };
}
