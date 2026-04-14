/**
 * Librería global de colores del proyecto.
 * Fuente única de verdad: primarios, secundarios, texto, botones, estados.
 * Light y Dark mode. Map pins y UI referencian esta paleta.
 */

import { Platform, type ViewStyle } from 'react-native';

// — Paleta Light (valores únicos; pines y UI referencian estas claves)
const primaryLight = '#0071e3';
const primaryPressedLight = '#005bb7';
const secondaryLight = '#6e6e73';
const textLight = '#1d1d1f';
const textSecondaryLight = '#6e6e73';
const backgroundLight = '#fbfbfd';
const backgroundElevatedLight = '#ffffff';
const borderLight = 'rgba(0, 0, 0, 0.06)';
const borderSubtleLight = 'rgba(0, 0, 0, 0.04)';
const surfaceMutedLight = '#e8e8ed';
const stateSuccessLight = '#34c759';
const stateErrorLight = '#ff3b30';
const stateToVisitLight = '#e6862b';
const stateFocusRingLight = 'rgba(0,113,227,0.35)';
const stateSurfaceHoverLight = 'rgba(0, 0, 0, 0.04)';
const stateSurfacePressedLight = 'rgba(0, 0, 0, 0.08)';
const surfaceOnMapLight = '#ffffff';
const overlayScrimLight = 'rgba(255, 255, 255, 1)';
const mapPreviewSurfaceLight = '#f6f4ef';
const mapPreviewCountryBaseLight = '#c7c2b6';
const mapPreviewCountryLineLight = '#ddd8cc';
const countriesPanelToVisitBackgroundLight = '#fbf7ef';
const countriesPanelToVisitBackgroundElevatedLight = '#f7f1e6';
const countriesPanelToVisitBorderLight = 'rgba(230,134,43,0.18)';
const countriesPanelToVisitBorderSubtleLight = 'rgba(230,134,43,0.11)';
const countriesPanelVisitedBackgroundLight = '#f6f8f4';
const countriesPanelVisitedBackgroundElevatedLight = '#eef3ea';
const countriesPanelVisitedBorderLight = 'rgba(52,199,89,0.16)';
const countriesPanelVisitedBorderSubtleLight = 'rgba(52,199,89,0.10)';
const countriesMapCountryBaseToVisitLight = '#c8c1b1';
const countriesMapCountryLineToVisitLight = '#ddd4c3';
const countriesMapCountryBaseVisitedLight = '#c4c8bf';
const countriesMapCountryLineVisitedLight = '#d9ddd3';
const countriesCounterToVisitBackgroundLight = 'rgba(255,246,236,0.92)';
const countriesCounterVisitedBackgroundLight = 'rgba(238,243,234,0.92)';
const countriesCounterToVisitBorderLight = countriesPanelToVisitBorderLight;
const countriesCounterVisitedBorderLight = countriesPanelVisitedBorderLight;
/** Buscador Explore: fondo «Todos»; gris muy tenue, luminancia cercana a countriesPanel* elevated. */
const searchPanelAllBackgroundLight = '#f2f2f4';
const searchPanelAllBackgroundDark = '#1c1c1e';

// — Pines en mapa (visibles sobre mapa claro en light y dark)
const pinDefaultLight = '#1d1d1f';
const pinPlannedLight = '#e6862b';
const pinVisitedLight = '#34c759';
const pinOutlineLight = '#ffffff';
const locationPrimaryLight = '#007AFF';
const mapPinSpotDefaultFillLight = '#7FB4DC';
const mapPinSpotDefaultStrokeLight = '#4E6F8A';
const mapPinSpotDefaultLabelTextLight = '#73A9D2';
const mapPinSpotDefaultLabelHaloLight = 'rgba(255,255,255,0.95)';
const mapPinSpotDefaultPlusTextLight = '#F7FBFF';
const mapPinSpotDefaultPlusHaloLight = 'rgba(58,96,128,0.3)';

// — Paleta Dark
const primaryDark = '#2997ff';
const primaryPressedDark = '#0a84ff';
const secondaryDark = '#a1a1a6';
const textDark = '#f5f5f7';
const textSecondaryDark = '#a1a1a6';
const backgroundDark = '#000000';
const backgroundElevatedDark = '#1d1d1f';
const borderDark = 'rgba(255, 255, 255, 0.08)';
const borderSubtleDark = 'rgba(255, 255, 255, 0.04)';
const surfaceMutedDark = '#2c2c2e';
const stateSuccessDark = '#30d158';
const stateErrorDark = '#ff453a';
const stateToVisitDark = '#ff9f0a';
const stateFocusRingDark = 'rgba(41,151,255,0.35)';
const stateSurfaceHoverDark = 'rgba(255, 255, 255, 0.08)';
const stateSurfacePressedDark = 'rgba(255, 255, 255, 0.14)';
const surfaceOnMapDark = 'rgba(255, 255, 255, 0.9)';
const overlayScrimDark = 'rgba(0, 0, 0, 1)';
const mapPreviewSurfaceDark = '#2a3140';
const mapPreviewCountryBaseDark = '#59617a';
const mapPreviewCountryLineDark = '#727a93';
const countriesPanelToVisitBackgroundDark = '#1A1A18';
const countriesPanelToVisitBackgroundElevatedDark = '#24221E';
const countriesPanelToVisitBorderDark = 'rgba(255,169,79,0.24)';
const countriesPanelToVisitBorderSubtleDark = 'rgba(255,169,79,0.15)';
const countriesPanelVisitedBackgroundDark = '#101D19';
const countriesPanelVisitedBackgroundElevatedDark = '#162823';
const countriesPanelVisitedBorderDark = 'rgba(48,209,88,0.26)';
const countriesPanelVisitedBorderSubtleDark = 'rgba(48,209,88,0.16)';
const countriesMapCountryBaseToVisitDark = '#777164';
const countriesMapCountryLineToVisitDark = '#928A7B';
const countriesMapCountryBaseVisitedDark = '#66746D';
const countriesMapCountryLineVisitedDark = '#7E8E86';
const countriesCounterToVisitBackgroundDark = 'rgba(36,34,30,0.88)';
const countriesCounterVisitedBackgroundDark = 'rgba(22,40,35,0.88)';
const countriesCounterToVisitBorderDark = countriesPanelToVisitBorderDark;
const countriesCounterVisitedBorderDark = countriesPanelVisitedBorderDark;

// — Pines en mapa (dark mode: mismos valores que light para contraste sobre mapa claro)
const pinDefaultDark = '#1d1d1f';
const pinPlannedDark = '#e6862b';
const pinVisitedDark = '#34c759';
const pinOutlineDark = '#ffffff';
const locationPrimaryDark = '#0a84ff';
const mapPinSpotDefaultFillDark = '#6D8FAF';
const mapPinSpotDefaultStrokeDark = '#0E1520';
const mapPinSpotDefaultLabelTextDark = '#C8D9EA';
const mapPinSpotDefaultLabelHaloDark = 'rgba(7,12,18,0.9)';
const mapPinSpotDefaultPlusTextDark = '#EFF6FD';
const mapPinSpotDefaultPlusHaloDark = 'rgba(7,12,18,0.55)';

export const Colors = {
  light: {
    primary: primaryLight,
    tintPressed: primaryPressedLight,
    secondary: secondaryLight,
    text: textLight,
    textSecondary: textSecondaryLight,
    background: backgroundLight,
    backgroundElevated: backgroundElevatedLight,
    border: borderLight,
    borderSubtle: borderSubtleLight,
    surfaceMuted: surfaceMutedLight,
    stateSuccess: stateSuccessLight,
    stateError: stateErrorLight,
    stateToVisit: stateToVisitLight,
    stateFocusRing: stateFocusRingLight,
    stateSurfaceHover: stateSurfaceHoverLight,
    stateSurfacePressed: stateSurfacePressedLight,
    surfaceOnMap: surfaceOnMapLight,
    overlayScrim: overlayScrimLight,
    mapPreviewSurface: mapPreviewSurfaceLight,
    mapPreviewCountryBase: mapPreviewCountryBaseLight,
    mapPreviewCountryLine: mapPreviewCountryLineLight,
    countriesPanelToVisitBackground: countriesPanelToVisitBackgroundLight,
    countriesPanelToVisitBackgroundElevated: countriesPanelToVisitBackgroundElevatedLight,
    countriesPanelToVisitBorder: countriesPanelToVisitBorderLight,
    countriesPanelToVisitBorderSubtle: countriesPanelToVisitBorderSubtleLight,
    countriesPanelVisitedBackground: countriesPanelVisitedBackgroundLight,
    countriesPanelVisitedBackgroundElevated: countriesPanelVisitedBackgroundElevatedLight,
    countriesPanelVisitedBorder: countriesPanelVisitedBorderLight,
    countriesPanelVisitedBorderSubtle: countriesPanelVisitedBorderSubtleLight,
    countriesMapCountryBaseToVisit: countriesMapCountryBaseToVisitLight,
    countriesMapCountryLineToVisit: countriesMapCountryLineToVisitLight,
    countriesMapCountryBaseVisited: countriesMapCountryBaseVisitedLight,
    countriesMapCountryLineVisited: countriesMapCountryLineVisitedLight,
    countriesCounterToVisitBackground: countriesCounterToVisitBackgroundLight,
    countriesCounterVisitedBackground: countriesCounterVisitedBackgroundLight,
    countriesCounterToVisitBorder: countriesCounterToVisitBorderLight,
    countriesCounterVisitedBorder: countriesCounterVisitedBorderLight,
    searchPanelAllBackground: searchPanelAllBackgroundLight,
    tint: primaryLight,
    icon: textSecondaryLight,
    tabIconDefault: textSecondaryLight,
    tabIconSelected: primaryLight,
    buttonPrimary: primaryLight,
    buttonSecondary: borderLight,
    pin: {
      default: pinDefaultLight,
      planned: pinPlannedLight,
      visited: pinVisitedLight,
      outline: pinOutlineLight,
    },
    mapPinSpot: {
      default: {
        fill: mapPinSpotDefaultFillLight,
        stroke: mapPinSpotDefaultStrokeLight,
        labelText: mapPinSpotDefaultLabelTextLight,
        labelHalo: mapPinSpotDefaultLabelHaloLight,
        labelHaloWidth: 1.1,
        plusText: mapPinSpotDefaultPlusTextLight,
        plusHalo: mapPinSpotDefaultPlusHaloLight,
        plusHaloWidth: 0.9,
      },
      toVisit: {
        fill: pinPlannedLight,
        stroke: 'rgba(255,255,255,0.95)',
      },
      visited: {
        fill: pinVisitedLight,
        stroke: 'rgba(255,255,255,0.95)',
      },
      selected: {
        radius: 12,
        strokeWidth: 2.5,
        defaultStroke: '#355774',
        toVisitStroke: 'rgba(255,255,255,1)',
        visitedStroke: 'rgba(255,255,255,1)',
        plusTextSize: 16,
        makiIconSize: 2.0,
        labelSizeDelta: 1,
        labelOffsetY: 1.08,
      },
      unselected: {
        radius: 8,
        strokeWidth: 1.5,
        plusTextSize: 14,
        makiIconSize: 1.7,
        labelOffsetY: 0.94,
      },
      cluster: {
        radiusMin: 12,
        radiusMax: 24,
        countMax: 100,
        fill: 'rgba(29,29,31,0.85)',
        stroke: 'rgba(255,255,255,0.9)',
        textSize: 12,
        /** Light: fondo oscuro → texto blanco. */
        textColor: '#ffffff',
      },
    },
    location: { primary: locationPrimaryLight },
    pinUserLocation: locationPrimaryLight,
    pinSpotDefault: pinDefaultLight,
    pinSpotToVisit: pinPlannedLight,
    pinSpotVisited: pinVisitedLight,
    pinSpotOutline: pinOutlineLight,
  },
  dark: {
    primary: primaryDark,
    tintPressed: primaryPressedDark,
    secondary: secondaryDark,
    text: textDark,
    textSecondary: textSecondaryDark,
    background: backgroundDark,
    backgroundElevated: backgroundElevatedDark,
    border: borderDark,
    borderSubtle: borderSubtleDark,
    surfaceMuted: surfaceMutedDark,
    stateSuccess: stateSuccessDark,
    stateError: stateErrorDark,
    stateToVisit: stateToVisitDark,
    stateFocusRing: stateFocusRingDark,
    stateSurfaceHover: stateSurfaceHoverDark,
    stateSurfacePressed: stateSurfacePressedDark,
    surfaceOnMap: surfaceOnMapDark,
    overlayScrim: overlayScrimDark,
    mapPreviewSurface: mapPreviewSurfaceDark,
    mapPreviewCountryBase: mapPreviewCountryBaseDark,
    mapPreviewCountryLine: mapPreviewCountryLineDark,
    countriesPanelToVisitBackground: countriesPanelToVisitBackgroundDark,
    countriesPanelToVisitBackgroundElevated: countriesPanelToVisitBackgroundElevatedDark,
    countriesPanelToVisitBorder: countriesPanelToVisitBorderDark,
    countriesPanelToVisitBorderSubtle: countriesPanelToVisitBorderSubtleDark,
    countriesPanelVisitedBackground: countriesPanelVisitedBackgroundDark,
    countriesPanelVisitedBackgroundElevated: countriesPanelVisitedBackgroundElevatedDark,
    countriesPanelVisitedBorder: countriesPanelVisitedBorderDark,
    countriesPanelVisitedBorderSubtle: countriesPanelVisitedBorderSubtleDark,
    countriesMapCountryBaseToVisit: countriesMapCountryBaseToVisitDark,
    countriesMapCountryLineToVisit: countriesMapCountryLineToVisitDark,
    countriesMapCountryBaseVisited: countriesMapCountryBaseVisitedDark,
    countriesMapCountryLineVisited: countriesMapCountryLineVisitedDark,
    countriesCounterToVisitBackground: countriesCounterToVisitBackgroundDark,
    countriesCounterVisitedBackground: countriesCounterVisitedBackgroundDark,
    countriesCounterToVisitBorder: countriesCounterToVisitBorderDark,
    countriesCounterVisitedBorder: countriesCounterVisitedBorderDark,
    searchPanelAllBackground: searchPanelAllBackgroundDark,
    tint: primaryDark,
    icon: textSecondaryDark,
    tabIconDefault: textSecondaryDark,
    tabIconSelected: primaryDark,
    buttonPrimary: primaryDark,
    buttonSecondary: borderDark,
    pin: {
      default: pinDefaultDark,
      planned: pinPlannedDark,
      visited: pinVisitedDark,
      outline: pinOutlineDark,
    },
    mapPinSpot: {
      default: {
        fill: mapPinSpotDefaultFillDark,
        stroke: mapPinSpotDefaultStrokeDark,
        labelText: mapPinSpotDefaultLabelTextDark,
        labelHalo: mapPinSpotDefaultLabelHaloDark,
        labelHaloWidth: 0.95,
        plusText: mapPinSpotDefaultPlusTextDark,
        plusHalo: mapPinSpotDefaultPlusHaloDark,
        plusHaloWidth: 0.75,
      },
      toVisit: {
        fill: pinPlannedDark,
        stroke: 'rgba(0,0,0,0.5)',
      },
      visited: {
        fill: pinVisitedDark,
        stroke: 'rgba(0,0,0,0.5)',
      },
      selected: {
        radius: 12,
        strokeWidth: 2.5,
        defaultStroke: '#D6E3EF',
        toVisitStroke: 'rgba(255,255,255,0.9)',
        visitedStroke: 'rgba(255,255,255,0.9)',
        plusTextSize: 16,
        makiIconSize: 2.0,
        labelSizeDelta: 1,
        labelOffsetY: 1.08,
      },
      unselected: {
        radius: 8,
        strokeWidth: 1.5,
        plusTextSize: 14,
        makiIconSize: 1.7,
        labelOffsetY: 0.94,
      },
      cluster: {
        radiusMin: 12,
        radiusMax: 24,
        countMax: 100,
        fill: 'rgba(214,227,239,0.9)',
        stroke: 'rgba(0,0,0,0.4)',
        textSize: 12,
        /** Dark: fondo claro → texto negro para contraste. */
        textColor: '#1d1d1f',
      },
    },
    location: { primary: locationPrimaryDark },
    pinUserLocation: locationPrimaryDark,
    pinSpotDefault: pinDefaultDark,
    pinSpotToVisit: pinPlannedDark,
    pinSpotVisited: pinVisitedDark,
    pinSpotOutline: pinOutlineDark,
  },
};

/** Ritmo de espaciado (px). */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Web: evita zoom por doble tap en botones interactivos.
 * Usar en Pressable de acciones.
 */
export const WebTouchManipulation: ViewStyle =
  Platform.OS === 'web' ? { touchAction: 'manipulation' } : {};

/** Radios de borde suaves. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  /**
   * Contenedor del campo en SearchSurface (icono + SearchInputV2 embebido) y launcher en CountriesSheet.
   * Debe coincidir con la silueta que ve el usuario en el buscador a pantalla completa.
   */
  searchSurfacePill: 22,
  /** Pill / totalmente redondeado (chips, botones de acción). */
  pill: 9999,
} as const;

/**
 * Elevación (sombra de superficie). Nombre alineado a guías tipo Material; en iOS/Android equivale a sombra nativa.
 * Web: `boxShadow`; iOS: `shadow*`; Android: `elevation`.
 * `raised`: capa más marcada (modales, sheets destacados).
 *
 * `Shadow` es alias del mismo objeto (retrocompatibilidad con spreads `...Shadow.subtle` en el repo).
 */
export const Elevation = {
  subtle: Platform.select<ViewStyle>({
    web: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)' },
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  }) ?? {},
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)' },
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    android: { elevation: 4 },
    default: {},
  }) ?? {},
  raised: Platform.select<ViewStyle>({
    web: { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.14), 0 4px 12px rgba(0, 0, 0, 0.1)' },
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
    },
    android: { elevation: 12 },
    default: {},
  }) ?? {},
} as const;

/** @deprecated Preferir `Elevation`; mismo objeto y claves (`subtle`, `card`, `raised`). */
export const Shadow = Elevation;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Noto Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Noto Sans', 'SF Pro Rounded', -apple-system, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
});
