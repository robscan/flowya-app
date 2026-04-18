/**
 * Listado de países del sheet (expanded): filas con acción a búsqueda.
 */

import type { CountrySheetItem } from '@/components/design-system/countries-sheet-types';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export type CountriesSheetCountryListColors = {
  text: string;
  textSecondary: string;
  primary: string;
};

export type CountriesSheetCountryListProps = {
  items: CountrySheetItem[];
  onItemPress: (item: CountrySheetItem) => void;
  colors: CountriesSheetCountryListColors;
  maxHeight?: number;
  /** Si true, no envuelve en `ScrollView` (scroll lo aporta el padre, p. ej. `CountriesSheet`). */
  embeddedInParentScroll?: boolean;
};

export function CountriesSheetCountryList({
  items,
  onItemPress,
  colors,
  maxHeight,
  embeddedInParentScroll = false,
}: CountriesSheetCountryListProps) {
  const rows = items.map((item) => (
    <Pressable
      key={item.key}
      onPress={() => onItemPress(item)}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Buscar en ${item.label}`}
    >
      <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
      <View style={styles.itemRight}>
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>{`${item.count} lugares`}</Text>
        <ChevronRight size={14} color={colors.primary} strokeWidth={2.2} />
      </View>
    </Pressable>
  ));

  if (embeddedInParentScroll) {
    return <View style={[styles.listScroll, styles.embeddedRoot]}>{rows}</View>;
  }

  return (
    <ScrollView
      style={[styles.listScroll, maxHeight != null ? { maxHeight } : undefined]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator
    >
      {rows}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listScroll: {
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  /** Misma separación vertical que `listScroll` + `listContent` sin duplicar `marginTop`. */
  embeddedRoot: {
    paddingBottom: Spacing.lg,
  },
  item: {
    minHeight: 44,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  itemPressed: {
    opacity: 0.72,
  },
  itemLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
  },
  itemCount: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'right',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 88,
    justifyContent: 'flex-end',
  },
});
