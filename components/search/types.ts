import type { MapPinFilterCounts, MapPinFilterValue } from '@/components/design-system/map-pin-filter';
import type { UseSearchControllerV2Return } from '@/hooks/search/useSearchControllerV2';
import type { ExploreListDensity } from '@/lib/storage/exploreListDensityPreference';
import type { PlaceResult } from '@/lib/places/searchPlaces';
import type { ReactNode } from 'react';
import type { SearchSection } from './SearchResultsListV2';

export type { SearchSection };

/** Arg para `placesFiltersBar` en forma función (misma fila buscador + CTA que sheet Lugares). */
export type PlacesFiltersBarRenderProps = {
  searchField: ReactNode;
};

export type SearchFloatingProps<T> = {
  /** Controller de Search V2 (useSearchControllerV2); el padre configura setOnSelect/setOnCreate. */
  controller: UseSearchControllerV2Return<T>;
  /** Items a mostrar cuando la query está vacía (ej. "Cercanos"). */
  defaultItems: T[];
  /** Secciones para isEmpty cuando pinFilter saved/visited (Spots en la zona, Spots en el mapa). */
  defaultItemSections?: SearchSection<T>[];
  /** Queries recientes para estado pre-búsqueda. */
  recentQueries: string[];
  /** Items vistos recientemente (por id). */
  recentViewedItems: T[];
  /** Render de cada item en listados. */
  renderItem: (item: T) => ReactNode;
  /** Etiqueta de etapa cuando hay resultados (ej. "En esta zona"). */
  stageLabel: string;
  /** Resultados renderizados en UI (override opcional sobre controller.results). */
  resultsOverride?: T[];
  /** Secciones opcionales para resultados (ej. cercanos vs en todo el mapa). */
  resultSections?: SearchSection<T>[];
  /** Cabecera encima del listado: "N resultados de «query»" cuando hay búsqueda activa y resultados. */
  resultsSummaryLabel?: string;
  /** Si true, permite mostrar resultados aunque la query esté vacía (caso KPI Spots). */
  showResultsOnEmpty?: boolean;
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
  /** Filtro de pins: Todos / Por visitar / Visitados. Si no se pasa, no se muestra filtro. */
  pinFilter?: MapPinFilterValue;
  pinCounts?: MapPinFilterCounts;
  onPinFilterChange?: (value: MapPinFilterValue) => void;
  /** OL-EXPLORE-TAGS-001: chips de filtro por tag (solo owner); opcional. */
  tagFilterOptions?: { id: string; name: string; count: number }[];
  /** Vacío = sin filtro. Varios ids = OR (al menos una etiqueta). */
  selectedTagFilterIds?: readonly string[];
  onTagFilterChange?: (tagIds: string[]) => void;
  /** Modo edición: long-press en chip # muestra X para borrar etiqueta global. */
  tagFilterEditMode?: boolean;
  onTagFilterEnterEditMode?: () => void;
  onTagFilterExitEditMode?: () => void;
  onRequestDeleteUserTag?: (tagId: string, tagName: string) => void;
  /** Sugerencias Mapbox para crear spot en lugar (solo cuando isNoResults, query >= 3). */
  placeSuggestions?: PlaceResult[];
  /** Callback al seleccionar un lugar de placeSuggestions. */
  onCreateFromPlace?: (place: PlaceResult) => void;
  /**
   * Si false, el input de búsqueda no recibe foco al abrir el overlay (más altura útil para el listado).
   * Ej.: entrada desde chip de etiqueta en la ficha del lugar.
   */
  searchInputAutoFocus?: boolean;
  /**
   * Paridad con sheet Lugares: fila **buscador | CTA** + chips debajo (vía `filtersEntryLeading` en el bar).
   * Puede ser un `ReactNode` (legado: buscador ancho completo arriba + bar debajo) o una **función**
   * `( { searchField } ) => …` que recibe el pastillón del input para componer la misma fila que el sheet.
   * Si se pasa, no se pinta la fila inline `ExploreTagFilterChipRow` en `SearchSurface` (edición en modal).
   */
  placesFiltersBar?: ReactNode | ((props: PlacesFiltersBarRenderProps) => ReactNode);
  /**
   * Paridad con `CountriesSheet` (lista Lugares): slot derecho en la **primera** cabecera de sección con ítems
   * cuando `pinFilter` es `saved`/`visited` (p. ej. CTA «Seleccionar» / «Cancelar» para etiquetado masivo).
   */
  placesListFirstSectionHeaderRight?: ReactNode;
  /** Densidad canónica para cards internas de SearchSurface (p. ej. recomendaciones Mapbox). */
  listDensity?: ExploreListDensity;
};
