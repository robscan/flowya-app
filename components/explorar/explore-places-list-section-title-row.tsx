import { Spacing } from '@/constants/theme';
import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

export type ExplorePlacesListSectionTitleRowProps = {
  title: string;
  titleColor: string;
  /** Glow/shadow opcional (p. ej. `SearchSurface` en dark). */
  titleStyle?: TextStyle;
  right?: ReactNode;
  accessibilityRole?: 'header';
};

/**
 * Cabecera canónica de sección de listados Explore (sheet Lugares / buscador):
 * título en mayúsculas + slot derecho opcional (CTA terciario).
 * Paridad tipográfica con `SearchSurface` (`sectionHeader`) y `CountriesSheet` (`placesSectionHeader*`).
 */
export function ExplorePlacesListSectionTitleRow({
  title,
  titleColor,
  titleStyle,
  right,
  accessibilityRole = 'header',
}: ExplorePlacesListSectionTitleRowProps) {
  if (!right) {
    return (
      <Text
        style={[styles.titleBlock, { color: titleColor }, titleStyle]}
        accessibilityRole={accessibilityRole}
      >
        {title}
      </Text>
    );
  }
  return (
    <View style={styles.row}>
      <Text
        style={[styles.titleInline, { color: titleColor }, titleStyle]}
        accessibilityRole={accessibilityRole}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  titleInline: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 18,
    flex: 1,
    minWidth: 0,
  },
  right: {
    flexShrink: 0,
  },
});
