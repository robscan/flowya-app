/**
 * Deja que React pinte el estado (p. ej. spinner) antes de operaciones que bloquean el hilo
 * o abren el selector nativo / diálogo de archivos.
 */
export async function yieldToPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}
