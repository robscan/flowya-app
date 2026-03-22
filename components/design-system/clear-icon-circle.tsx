/**
 * Botón circular de limpiar (X).
 * - `variant="filter"`: fondo sólido legible sobre pills de filtro (naranja/verde).
 * - `variant="search"`: compacto para barra de búsqueda (no invade el pill).
 * Hit ≥ 44pt: tamaño visual menor + hitSlop.
 */

import { X } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { WebTouchManipulation } from '@/constants/theme';

const SIZE_FILTER = 32;
const SIZE_SEARCH = 26;
const ICON_FILTER = 16;
const ICON_SEARCH = 13;
const HIT_SLOP_SEARCH = 10;

export type ClearIconCircleVariant = 'filter' | 'search';

export type ClearIconCircleProps = {
  onPress: () => void;
  accessibilityLabel: string;
  iconColor: string;
  /** Color de acento del pill (ej. naranja filtro); define overlay sólido encima. */
  backgroundColor: string;
  /** filter: chip mapa; search: input embebido (más pequeño). */
  variant?: ClearIconCircleVariant;
  testID?: string;
};

function overlaySolid(pressed: boolean): string {
  // Capa oscura opaca sobre pills de marca — contraste claro del ícono X.
  return pressed ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.32)';
}

export function ClearIconCircle({
  onPress,
  accessibilityLabel,
  iconColor,
  backgroundColor: _pillAccent,
  variant = 'filter',
  testID,
}: ClearIconCircleProps) {
  void _pillAccent; // reservado si más adelante mezclamos con el color del chip
  const isSearch = variant === 'search';
  const size = isSearch ? SIZE_SEARCH : SIZE_FILTER;
  const iconPx = isSearch ? ICON_SEARCH : ICON_FILTER;
  const hitSlop = isSearch ? HIT_SLOP_SEARCH : 8;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isSearch
            ? pressed
              ? 'rgba(128,128,128,0.35)'
              : 'rgba(128,128,128,0.22)'
            : overlaySolid(pressed),
        },
        Platform.OS === 'web' && { cursor: 'pointer' },
      ]}
      {...WebTouchManipulation}
    >
      <View style={styles.iconCenter}>
        <X size={iconPx} color={iconColor} strokeWidth={isSearch ? 2 : 2.2} />
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
