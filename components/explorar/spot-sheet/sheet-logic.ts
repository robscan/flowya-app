import type { SheetState } from "@/components/explorar/SpotSheet";

export type SnapDecisionArgs = {
  visible: number;
  velocityY: number;
  collapsedAnchor: number;
  mediumVisible: number;
  expandedVisible: number;
  velocitySnapThreshold: number;
  snapPositionThreshold: number;
};

export function getSheetHeightForState(
  state: SheetState,
  collapsedAnchor: number,
  mediumVisible: number,
  expandedVisible: number,
) {
  if (state === "peek") return collapsedAnchor;
  if (state === "medium") return mediumVisible;
  return expandedVisible;
}

export function resolveNextSheetStateFromGesture({
  visible,
  velocityY,
  collapsedAnchor,
  mediumVisible,
  expandedVisible,
  velocitySnapThreshold,
  snapPositionThreshold,
}: SnapDecisionArgs): SheetState {
  const midCollapsedMedium =
    collapsedAnchor + (mediumVisible - collapsedAnchor) * 0.5;

  if (visible <= midCollapsedMedium) {
    const band = mediumVisible - collapsedAnchor;
    const towardMedium = band > 0 ? (visible - collapsedAnchor) / band : 0;
    if (velocityY < -velocitySnapThreshold) return "medium";
    if (velocityY > velocitySnapThreshold) return "peek";
    return towardMedium >= snapPositionThreshold ? "medium" : "peek";
  }

  const band = expandedVisible - mediumVisible;
  const towardExpanded = band > 0 ? (visible - mediumVisible) / band : 0;
  if (velocityY < -velocitySnapThreshold) return "expanded";
  if (velocityY > velocitySnapThreshold) return "medium";
  return towardExpanded >= snapPositionThreshold ? "expanded" : "medium";
}
