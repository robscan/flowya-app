/** Tipos compartidos del sheet de países (Explore). */

export type CountriesSheetState = 'peek' | 'medium' | 'expanded';

export type CountrySheetItem = {
  key: string;
  label: string;
  count: number;
};

/**
 * Vista de listado dentro del sheet (mismo template: cabecera atrás + chips + lista).
 * `country`: spots de ese país; `all_places`: todos los lugares del pool del overlay (mismo criterio que buckets).
 */
export type CountriesSheetListDetail =
  | { kind: "country"; key: string; label: string }
  | { kind: "all_places" };
