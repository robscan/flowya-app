/**
 * Vitrina DS: `CountriesSheetCountryList` con o sin envoltorio de tarjeta.
 */

import { CountriesSheetCountryList } from '@/components/design-system/countries-sheet-country-list';
import type { CountrySheetItem } from '@/components/design-system/countries-sheet-types';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

export const DS_MOCK_COUNTRY_ITEMS: CountrySheetItem[] = [
  { key: 'iso:MX', label: 'México', count: 12 },
  { key: 'iso:ES', label: 'España', count: 8 },
  { key: 'iso:FR', label: 'Francia', count: 6 },
  { key: 'iso:IT', label: 'Italia', count: 5 },
  { key: 'iso:JP', label: 'Japón', count: 4 },
];

type SheetListColors = {
  text: string;
  textSecondary: string;
  primary: string;
};

type CountriesSheetListDemoProps = {
  filterMode: 'saved' | 'visited';
  items?: CountrySheetItem[];
  maxHeight?: number;
  embedded?: boolean;
  sheetColors?: SheetListColors;
};

export function CountriesSheetListDemo({
  filterMode,
  items = DS_MOCK_COUNTRY_ITEMS,
  maxHeight = 220,
  embedded = false,
  sheetColors: sheetColorsProp,
}: CountriesSheetListDemoProps) {
  const colorScheme = useColorScheme();
  const derived = useMemo(() => {
    const base = Colors[colorScheme ?? 'light'];
    return filterMode === 'saved'
      ? {
          text: base.text,
          textSecondary: base.textSecondary,
          primary: base.primary,
          panelBg: base.countriesPanelToVisitBackgroundElevated,
          borderSubtle: base.countriesPanelToVisitBorderSubtle,
        }
      : {
          text: base.text,
          textSecondary: base.textSecondary,
          primary: base.primary,
          panelBg: base.countriesPanelVisitedBackgroundElevated,
          borderSubtle: base.countriesPanelVisitedBorderSubtle,
        };
  }, [colorScheme, filterMode]);

  const c: SheetListColors =
    sheetColorsProp ?? {
      text: derived.text,
      textSecondary: derived.textSecondary,
      primary: derived.primary,
    };

  const list = (
    <CountriesSheetCountryList
      items={items}
      onItemPress={() => {}}
      maxHeight={maxHeight}
      colors={c}
    />
  );

  if (embedded) {
    return list;
  }

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: derived.panelBg,
          borderColor: derived.borderSubtle,
        },
      ]}
    >
      {list}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
