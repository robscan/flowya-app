/**
 * Fila canónica del menú desplegable MapPinFilter (DS).
 * Una sola línea: ícono + etiqueta (sin encoger texto) + metadatos (badge, check).
 * El ancho lo fija el contenido; no usar flex:1 en el label.
 */

import { Check } from 'lucide-react-native';
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
  trailingCheck?: boolean;
  checkColor: string;
  pendingDot?: React.ReactNode;
};

export function MapPinFilterMenuOption({
  label,
  labelColor,
  leadingIcon,
  countBadge,
  trailingCheck,
  checkColor,
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
        {trailingCheck ? (
          <Check size={18} color={checkColor} strokeWidth={2.5} />
        ) : (
          <View style={styles.checkPlaceholder} />
        )}
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
  checkPlaceholder: {
    width: 18,
    height: 18,
  },
});
