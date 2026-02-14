/**
 * core/shared/visibility-softdelete/contracts.ts — Tipos para visibility y soft delete.
 */

export type VisibilityFlag = { isHidden: boolean };

export type VisibilityFilterOptions = { includeHidden?: boolean };

export type SoftDeleteEvent = {
  spotId: string;
  isHidden: boolean;
  atMs: number;
};

export type SoftDeletePolicy = { defaultIncludeHidden: boolean };

export const SOFT_DELETE_POLICY_DEFAULT: SoftDeletePolicy = {
  defaultIncludeHidden: false,
};

/** Helper type: T con isHidden explícitamente false. */
export type OnlyVisible<T extends { isHidden?: boolean }> = T & {
  isHidden?: false;
};
