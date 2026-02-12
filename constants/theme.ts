/**
 * Librería global de colores del proyecto.
 * Fuente única de verdad: primarios, secundarios, texto, botones, estados.
 * Light y Dark mode. Map pins y UI referencian esta paleta.
 */

import { Platform } from 'react-native';

// — Paleta Light (valores únicos; pines y UI referencian estas claves)
const primaryLight = '#0071e3';
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
const surfaceOnMapLight = '#ffffff';
const overlayScrimLight = 'rgba(255, 255, 255, 0.32)';

// — Pines en mapa (visibles sobre mapa claro en light y dark)
const pinDefaultLight = '#1d1d1f';
const pinPlannedLight = '#e6862b';
const pinVisitedLight = '#34c759';
const pinOutlineLight = '#ffffff';
const locationPrimaryLight = '#007AFF';

// — Paleta Dark
const primaryDark = '#2997ff';
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
const surfaceOnMapDark = 'rgba(255, 255, 255, 0.9)';
const overlayScrimDark = 'rgba(0, 0, 0, 0.32)';

// — Pines en mapa (dark mode: mismos valores que light para contraste sobre mapa claro)
const pinDefaultDark = '#1d1d1f';
const pinPlannedDark = '#e6862b';
const pinVisitedDark = '#34c759';
const pinOutlineDark = '#ffffff';
const locationPrimaryDark = '#0a84ff';

export const Colors = {
  light: {
    primary: primaryLight,
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
    surfaceOnMap: surfaceOnMapLight,
    overlayScrim: overlayScrimLight,
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
    surfaceOnMap: surfaceOnMapDark,
    overlayScrim: overlayScrimDark,
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
export const WebTouchManipulation =
  Platform.OS === 'web' ? { touchAction: 'manipulation' as const } : {};

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
    sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', -apple-system, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
});
