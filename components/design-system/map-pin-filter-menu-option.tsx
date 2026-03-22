/**
 * Fila canónica del menú desplegable MapPinFilter (DS).
 * Una sola línea: ícono + etiqueta (sin encoger texto) + metadatos (badge, pendiente).
 * El estado activo se marca con borde izquierdo en el Pressable padre, sin check redundante.
 */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { TextStyle } from 'react-native';

import { Spacing } from '@/constants/theme';

import { TypographyStyles } from './typography';

export type MapPinFilterMenuOptionProps = {
  label: string;
  labelColor: string;
  leadingIcon: React.ReactNode;
  countBadge?: React.ReactNode;
  pendingDot?: React.ReactNode;
};

export function MapPinFilterMenuOption({
  label,
  labelColor,
  leadingIcon,
  countBadge,
  pendingDot,
}: MapPinFilterMenuOptionProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {leadingIcon}
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            TypographyStyles.filterLabel,
            styles.label,
            { color: labelColor },
            Platform.OS === 'web' && ({ whiteSpace: 'nowrap' } as TextStyle),
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.meta}>
        {countBadge}
        {pendingDot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  label: {
    flexShrink: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    flexShrink: 0,
  },
});
