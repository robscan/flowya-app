/**
 * core/shared/visibility-softdelete/filter.ts — Helpers puros para filtrar visibles.
 */

export function isVisible(item: { isHidden?: boolean }): boolean {
  return item.isHidden !== true;
}

export function onlyVisible<T extends { isHidden?: boolean }>(items: T[]): T[] {
  return items.filter(isVisible);
}
