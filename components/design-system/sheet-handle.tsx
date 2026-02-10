/**
 * SheetHandle — Affordance visual de arrastre para sheets (ExploreSheet, SpotSheet, SearchFloating).
 * Canónico en DS: ver docs/contracts/DESIGN_SYSTEM_USAGE.md.
 * Web: hover/active con cambio sutil de opacidad (sin sombras ni blur).
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

const HANDLE_WIDTH = 36;
const HANDLE_HEIGHT = 4;
const HANDLE_BORDER_RADIUS = 2;

export type SheetHandleProps = {
  /** Si se pasa, al pulsar el handle se invoca (ej. expandir/colapsar sheet). */
  onPress?: () => void;
};

export function SheetHandle({ onPress }: SheetHandleProps = {}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [hovered, setHovered] = useState(false);

  const barColor = colors.textSecondary;
  const opacity = hovered ? 0.95 : 0.7;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.wrap,
        { opacity: pressed ? 0.95 : opacity },
      ]}
      onPress={onPress}
      accessibilityLabel="Arrastrar"
      accessibilityRole="none"
      onMouseEnter={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onMouseLeave={Platform.OS === 'web' ? () => setHovered(false) : undefined}
    >
      <View style={[styles.bar, { backgroundColor: barColor }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: HANDLE_BORDER_RADIUS,
  },
});
