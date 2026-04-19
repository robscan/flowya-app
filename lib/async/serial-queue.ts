export type SerialQueue = {
  /** Encola una tarea para ejecutarse en orden. */
  enqueue: <T>(task: () => Promise<T>) => Promise<T>;
};

/**
 * Cola serial para evitar carreras entre efectos dependientes (p. ej. sync + refresh).
 * Diseñada para UI: si una tarea falla, la cola sigue viva (no “rompe” la cadena).
 */
export function createSerialQueue(): SerialQueue {
  let chain: Promise<unknown> = Promise.resolve();
  return {
    enqueue: <T>(task: () => Promise<T>) => {
      const run = async () => await task();
      const next = chain.catch(() => {}).then(run);
      chain = next;
      return next;
    },
  };
}

