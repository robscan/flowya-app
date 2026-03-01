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

// — Pines en mapa (visibles sobre mapa claro en light y dark)
const pinDefaultLight = '#1d1d1f';
const pinPlannedLight = '#e6862b';
const pinVisitedLight = '#34c759';
const pinOutlineLight = '#ffffff';
const locationPrimaryLight = '#007AFF';

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

/** Sombras: deshabilitadas (shadow* deprecado; no usar boxShadow por ahora). Mantener export para no romper spreads existentes. */
export const Shadow = {
  subtle: {} as const,
  card: {} as const,
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
  /** Pill / totalmente redondeado (chips, botones de acción). */
  pill: 9999,
} as const;

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
