/**
 * core/shared/visibility-softdelete — Filtro is_hidden + mutación soft delete.
 * TODO: Extraer de MapScreenVNext, spot/[id], spot-duplicate-check.
 */

export type {
  VisibilityFlag,
  VisibilityFilterOptions,
  SoftDeleteEvent,
  SoftDeletePolicy,
  OnlyVisible,
} from "./contracts";

export { isVisible, onlyVisible } from "./filter";
