/**
 * Chip de etiqueta — modal de spot, búsqueda y ajustes (OL-EXPLORE-TAGS-001).
 */

import { X } from 'lucide-react-native';
import React from 'react';
import type { PressableProps } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type TagChipProps = {
  label: string;
  /** Sin #; el chip puede mostrarlo opcionalmente */
  showHash?: boolean;
  /** Quitar del spot: icono X al final del chip */
  onRemove?: () => void;
  /** Tocar para añadir (etiqueta guardada) */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Zona de toque extra en el Pressable (p. ej. CTA «Etiquetar» en listados). */
  pressableHitSlop?: PressableProps['hitSlop'];
  /** `suggested`: estilo neutro (sugeridas en modal antes de confirmar). */
  visualVariant?: 'default' | 'suggested';
};

export function TagChip({
  label,
  showHash = true,
  onRemove,
  onPress,
  disabled = false,
  accessibilityLabel,
  pressableHitSlop,
  visualVariant = 'default',
}: TagChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const display = showHash ? `#${label}` : label;
  const suggested = visualVariant === 'suggested';

  if (onRemove) {
    return (
      <View
        style={[
          styles.base,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.background,
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel ?? `Etiqueta ${label}`}
      >
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {display}
        </Text>
        <Pressable
          onPress={onRemove}
          disabled={disabled}
          hitSlop={8}
          style={styles.removeHit}
          accessibilityLabel={`Quitar ${label} de este spot`}
          accessibilityRole="button"
        >
          <X size={16} color={colors.stateError} strokeWidth={2.2} />
        </Pressable>
      </View>
    );
  }

  const content = (
    <View
      style={[
        styles.base,
        styles.pressableInner,
        {
          borderColor: colors.borderSubtle,
          backgroundColor: suggested ? colors.stateSurfaceHover : colors.background,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={[styles.label, { color: suggested ? colors.textSecondary : colors.text }]}
        numberOfLines={1}
      >
        {display}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={pressableHitSlop}
        accessibilityLabel={accessibilityLabel ?? `Añadir etiqueta ${label}`}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingLeft: Spacing.sm,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pressableInner: {
    paddingRight: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  removeHit: {
    padding: 2,
  },
});
