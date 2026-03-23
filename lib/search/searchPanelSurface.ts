/**
 * Superficie (chrome) del panel de búsqueda alineada con CountriesSheet cuando el filtro de pins
 * restringe a Por visitar / Visitados. Ver docs/definitions/search/SEARCH_V2.md.
 *
 * @see components/explorar/CountriesSheet.tsx — mismos tokens `countriesPanel*`.
 */

import type { MapPinFilterValue } from '@/components/design-system/map-pin-filter';
import { Colors } from '@/constants/theme';

export type SearchPanelSurfaceVariant = 'web' | 'native';

export type SearchPanelSurfaceColors = {
  backgroundColor: string;
  /** Solo nativo (sheet con borde); web usa solo `backgroundColor`. */
  borderColor?: string;
};

/**
 * Colores de fondo (y borde en native) del contenedor del buscador según `pinFilter`.
 * `all` / null: web y native → `searchPanelAllBackground` (gris tenue, luminancia ~countriesPanel*); nativo mantiene `borderSubtle`.
 */
export function getSearchPanelSurfaceColors(
  pinFilter: MapPinFilterValue | null | undefined,
  scheme: 'light' | 'dark',
  variant: SearchPanelSurfaceVariant,
): SearchPanelSurfaceColors {
  const c = Colors[scheme];
  const pf = pinFilter ?? 'all';
  if (pf === 'saved') {
    return {
      backgroundColor: c.countriesPanelToVisitBackgroundElevated,
      borderColor: c.countriesPanelToVisitBorderSubtle,
    };
  }
  if (pf === 'visited') {
    return {
      backgroundColor: c.countriesPanelVisitedBackgroundElevated,
      borderColor: c.countriesPanelVisitedBorderSubtle,
    };
  }
  if (variant === 'web') {
    return { backgroundColor: c.searchPanelAllBackground };
  }
  return {
    backgroundColor: c.searchPanelAllBackground,
    borderColor: c.borderSubtle,
  };
}
