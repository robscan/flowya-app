/**
 * Gestión de foco para navegación (web).
 * Evita el warning "Blocked aria-hidden because descendant retained focus":
 * 1) Guardar elemento con foco, 2) blur para que no quede foco debajo, 3) navegar.
 * Al volver, restaurar foco al elemento guardado.
 */

let savedFocusTarget: HTMLElement | null = null;

/** Quita el foco del elemento activo (web). Llamar ANTES de que el overlay/Spot Detail se renderice. */
export function blurActiveElement(): void {
  if (typeof document !== 'undefined') {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
  }
}

/** Guarda document.activeElement. Llamar antes de blur y navegar. */
export function saveFocusBeforeNavigate(): void {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    savedFocusTarget = document.activeElement;
  }
}

/** Obtiene y limpia el elemento guardado. Llamar al volver a la pantalla (ej. useFocusEffect). */
export function getAndClearSavedFocus(): HTMLElement | null {
  const el = savedFocusTarget;
  savedFocusTarget = null;
  return el;
}
