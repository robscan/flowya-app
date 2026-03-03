import type { PinFilter } from "../state";

export type PinStatusTransition = "to_visit" | "visited";
export type FilterTransitionPolicy = "sticky";
export type FilterTransitionCtaTarget = PinFilter | null;

export function resolveDestinationFilterForStatus(
  status: PinStatusTransition,
): Exclude<PinFilter, "all"> {
  return status === "to_visit" ? "saved" : "visited";
}

export function resolveFilterTransitionPolicy(args: {
  currentFilter: PinFilter;
  nextSaved: boolean;
  nextVisited: boolean;
  policy?: FilterTransitionPolicy;
}): {
  nextFilter: PinFilter;
  shouldPulse: boolean;
  ctaTargetFilter: FilterTransitionCtaTarget;
} {
  const { currentFilter, nextSaved, nextVisited } = args;
  const hasDestination = nextSaved || nextVisited;
  if (!hasDestination) {
    return {
      nextFilter: currentFilter,
      shouldPulse: currentFilter === "all",
      ctaTargetFilter: "all",
    };
  }
  const destinationFilter = resolveDestinationFilterForStatus(
    nextVisited ? "visited" : "to_visit",
  );
  return {
    nextFilter: currentFilter,
    shouldPulse: currentFilter === destinationFilter,
    ctaTargetFilter: destinationFilter,
  };
}

export function shouldClearSelectedSpotOnFilterChange(args: {
  prevFilter: PinFilter;
  nextFilter: PinFilter;
  hasSelectedSpot: boolean;
  isDraftSpot: boolean;
  isSelectedVisibleInNextFilter: boolean;
}): boolean {
  const {
    prevFilter,
    nextFilter,
    hasSelectedSpot,
    isDraftSpot,
    isSelectedVisibleInNextFilter,
  } = args;

  if (prevFilter === nextFilter) return false;
  if (!hasSelectedSpot) return false;
  if (isDraftSpot) return false;
  return !isSelectedVisibleInNextFilter;
}

export function shouldRestoreSelectionOnSearchClose(args: {
  wasSearchOpen: boolean;
  isSearchOpen: boolean;
  hasPreviousSelection: boolean;
  hasCurrentSelection: boolean;
}): boolean {
  const {
    wasSearchOpen,
    isSearchOpen,
    hasPreviousSelection,
    hasCurrentSelection,
  } = args;

  return (
    wasSearchOpen &&
    !isSearchOpen &&
    hasPreviousSelection &&
    !hasCurrentSelection
  );
}

export function shouldMarkPendingBadge(args: {
  currentFilter: PinFilter;
}): boolean {
  return args.currentFilter === "all";
}

/** @deprecated Usa resolveFilterTransitionPolicy(). */
export function shouldSwitchFilterOnStatusTransition(args: {
  currentFilter: PinFilter;
  destinationFilter: Exclude<PinFilter, "all">;
}): boolean {
  const { currentFilter, destinationFilter } = args;
  return currentFilter !== "all" && currentFilter !== destinationFilter;
}

/** @deprecated Usa resolveFilterTransitionPolicy(). */
export function shouldPulseFilterOnStatusTransition(args: {
  currentFilter: PinFilter;
  destinationFilter: Exclude<PinFilter, "all">;
}): boolean {
  return args.currentFilter === args.destinationFilter;
}
