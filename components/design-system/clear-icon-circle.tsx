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
  /** Reservado para futuros matices con el color del chip (p. ej. contraste). */
  backgroundColor?: string;
  disabled?: boolean;
  testID?: string;
};

export function ClearIconCircle({
  onPress,
  accessibilityLabel,
  iconColor,
  backgroundColor: _bg,
  disabled = false,
  testID,
}: ClearIconCircleProps) {
  void _bg;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

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
            ? BG_DEFAULT
            : pressed
              ? BG_PRESSED
              : hovered && Platform.OS === 'web'
                ? BG_HOVER_WEB
                : BG_DEFAULT,
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

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
