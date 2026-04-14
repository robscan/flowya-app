/**
 * Botón circular compacto de limpiar (X). Tamaño único (26px) + hitSlop para ≥44pt.
 * No usa IconButton: overlay gris sobre chips/filtros; uso canónico en mapa y búsqueda.
 */

import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Colors, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SIZE = 26;
const ICON_PX = 13;
const HIT_SLOP = 10;

const BG_DEFAULT = 'rgba(128,128,128,0.22)';
const BG_HOVER_WEB = 'rgba(128,128,128,0.28)';
const BG_PRESSED = 'rgba(128,128,128,0.35)';

/** Sobre fondo tint / primario: círculo claro semitransparente + icono claro (p. ej. chip de etiqueta en mapa). */
const BG_ON_PRIMARY_DEFAULT = 'rgba(255,255,255,0.26)';
const BG_ON_PRIMARY_HOVER_WEB = 'rgba(255,255,255,0.38)';
const BG_ON_PRIMARY_PRESSED = 'rgba(255,255,255,0.48)';

/** Referencia para la matriz DS y documentación (un solo tamaño canónico). */
export const CLEAR_ICON_CIRCLE_TOKENS = {
  sizePx: SIZE,
  iconPx: ICON_PX,
  hitSlop: HIT_SLOP,
  bgDefault: BG_DEFAULT,
  bgHoverWeb: BG_HOVER_WEB,
  bgPressed: BG_PRESSED,
} as const;

export type ClearIconCircleProps = {
  onPress: () => void;
  accessibilityLabel: string;
  iconColor: string;
  /**
   * `default`: disco gris neutro (buscador, chips sobre fondo claro).
   * `onPrimary`: disco blanco semitransparente; usar con `iconColor` claro sobre tint/primary.
   */
  variant?: 'default' | 'onPrimary';
  disabled?: boolean;
  testID?: string;
};

export function ClearIconCircle({
  onPress,
  accessibilityLabel,
  iconColor,
  variant = 'default',
  disabled = false,
  testID,
}: ClearIconCircleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const bgDefault = variant === 'onPrimary' ? BG_ON_PRIMARY_DEFAULT : BG_DEFAULT;
  const bgHover = variant === 'onPrimary' ? BG_ON_PRIMARY_HOVER_WEB : BG_HOVER_WEB;
  const bgPressed = variant === 'onPrimary' ? BG_ON_PRIMARY_PRESSED : BG_PRESSED;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.wrap,
        {
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          opacity: disabled ? 0.45 : 1,
          backgroundColor: disabled
            ? bgDefault
            : pressed
              ? bgPressed
              : hovered && Platform.OS === 'web'
                ? bgHover
                : bgDefault,
        },
        Platform.OS === 'web' && !disabled ? { cursor: 'pointer' as const } : null,
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
        WebTouchManipulation,
      ]}
    >
      <View style={styles.iconCenter}>
        <X size={ICON_PX} color={iconColor} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export type ClearIconCircleDecorationProps = {
  iconColor: string;
  variant?: 'default' | 'onPrimary';
  /** Diámetro del disco (el botón canónico sigue siendo 26px). */
  size?: number;
  iconPx?: number;
};

/**
 * Solo visual: disco semitransparente + X, sin Pressable.
 * Uso: dentro de un control más grande (p. ej. chip de etiqueta en mapa), mismo canon visual que ClearIconCircle.
 */
export function ClearIconCircleDecoration({
  iconColor,
  variant = 'onPrimary',
  size = 22,
  iconPx = 11,
}: ClearIconCircleDecorationProps) {
  const bgDefault = variant === 'onPrimary' ? BG_ON_PRIMARY_DEFAULT : BG_DEFAULT;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.decorationWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgDefault,
        },
      ]}
    >
      <X size={iconPx} color={iconColor} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
