import type { UseSearchControllerV2Return } from '@/hooks/search/useSearchControllerV2';
import type { ReactNode } from 'react';

export type SearchFloatingProps<T> = {
  /** Controller de Search V2 (useSearchControllerV2); el padre configura setOnSelect/setOnCreate. */
  controller: UseSearchControllerV2Return<T>;
  /** Items a mostrar cuando la query está vacía (ej. "Cercanos"). */
  defaultItems: T[];
  /** Queries recientes para estado pre-búsqueda. */
  recentQueries: string[];
  /** Items vistos recientemente (por id). */
  recentViewedItems: T[];
  /** Render de cada item en listados. */
  renderItem: (item: T) => ReactNode;
  /** Etiqueta de etapa cuando hay resultados (ej. "En esta zona"). */
  stageLabel: string;
  /** Mensaje cuando no hay items cercanos (query vacía). */
  emptyMessage?: string;
  /** Texto del CTA crear cuando no hay resultados (query >= 3). */
  onCreateLabel?: string;
  /** Contexto de sección para futuro ranking; por ahora no se usa. */
  scope?: string;
  /** Key estable para items en listas (ej. item => item.id). */
  getItemKey?: (item: T) => string;
  /** Insets para sheet (top/bottom). Si no se pasa, se usa 0. */
  insets?: { top: number; bottom: number };
};
