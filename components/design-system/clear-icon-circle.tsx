/**
 * Botón circular de limpiar (X) — hit target ≥ 44pt vía tamaño 36 + hitSlop.
 * Fondo semitransparente sobre pills de filtro / búsqueda.
 */

import { X } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { WebTouchManipulation } from '@/constants/theme';

const DEFAULT_SIZE = 36;
const ICON_SIZE = 18;
const HIT_SLOP = 8;

export type ClearIconCircleProps = {
  onPress: () => void;
  accessibilityLabel: string;
  iconColor: string;
  /** Color base para el fondo (se mezcla con alpha). */
  backgroundColor: string;
  size?: number;
  testID?: string;
};

export function ClearIconCircle({
  onPress,
  accessibilityLabel,
  iconColor,
  backgroundColor,
  size = DEFAULT_SIZE,
  testID,
}: ClearIconCircleProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? `${backgroundColor}99` : `${backgroundColor}66`,
        },
        Platform.OS === 'web' && { cursor: 'pointer' },
      ]}
      {...WebTouchManipulation}
    >
      <View style={styles.iconCenter}>
        <X size={ICON_SIZE} color={iconColor} strokeWidth={2} />
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
