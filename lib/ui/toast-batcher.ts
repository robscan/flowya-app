import type { SystemStatusShowOptions } from "@/components/ui/system-status-bar";

export type ToastShow = (message: string, options?: SystemStatusShowOptions) => void;

export type ToastBatcher = {
  /** Incrementa el contador y agenda (o re-agenda) un toast agregado. */
  bump: (n?: number) => void;
  /** Fuerza mostrar el toast pendiente (si existe) y reinicia contador. */
  flush: () => void;
  /** Cancela el toast pendiente y reinicia contador. */
  reset: () => void;
};

/**
 * Agrega varios eventos (p. ej. “imagen eliminada”) en un solo toast:
 * - Dentro de `windowMs` acumula conteo.
 * - Al vencer, muestra un mensaje calculado con `messageForCount`.
 */
export function createCountToastBatcher(args: {
  show: ToastShow;
  windowMs?: number;
  messageForCount: (count: number) => string;
  showOptions?: SystemStatusShowOptions;
}): ToastBatcher {
  const windowMs = args.windowMs ?? 900;
  let count = 0;
  let timer: number | null = null;

  const clear = () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const flush = () => {
    if (count <= 0) {
      clear();
      return;
    }
    const msg = args.messageForCount(count);
    count = 0;
    clear();
    args.show(msg, args.showOptions);
  };

  const bump = (n = 1) => {
    count += Math.max(0, n);
    clear();
    timer = window.setTimeout(() => flush(), windowMs);
  };

  const reset = () => {
    count = 0;
    clear();
  };

  return { bump, flush, reset };
}

