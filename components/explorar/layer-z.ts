/**
 * Canonical z-index contract for Explore overlays.
 * Keep all depth values centralized to avoid regressions by local tweaks.
 *
 * TOP_ACTIONS debe quedar por encima de FILTER: la franja del filtro ocupa todo el ancho
 * (left/right 0); si FILTER > TOP_ACTIONS, en web el overlay tapa el botón de búsqueda y
 * el bloque de perfil aunque usen pointerEvents box-none en el filtro.
 *
 * MAP_CONTROLS debe quedar **por encima de FILTER** (14): en algunos navegadores/layouts la
 * caja de hit-test del contenedor del filtro puede solaparse con la zona inferior del mapa;
 * si MAP_CONTROLS ≤ FILTER, los botones del mapa dejan de recibir toques (regresión WR-05).
 * Orden: FILTER (14) < MAP_CONTROLS (15) < TOP_ACTIONS (16).
 */
export const EXPLORE_LAYER_Z = {
  /** Fila inferior (FLOWYA + pastilla). El solape con MapControls en peek se evita por anclaje (MapScreenVNext). */
  FLOWYA_LABEL: 5,
  SHEET_BASE: 8,
  /** Capa transparente: tap fuera del listado del dropdown (debajo del menú, encima del resto del sheet). */
  SHEET_PLACES_SCOPE_SCRIM: 9,
  /** Menú desplegable del título (país / todos) encima del listado sin desplazar layout. */
  SHEET_HEADER_DROPDOWN: 12,
  FILTER: 14,
  /** Por encima del filtro (anclaje inferior derecho); debajo de TOP_ACTIONS. */
  MAP_CONTROLS: 15,
  /** Por encima de FILTER — botón buscar, perfil, slogan superior. */
  TOP_ACTIONS: 16,
} as const;

