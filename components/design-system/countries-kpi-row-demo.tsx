/**
 * Vitrina DS: envoltorio sobre `CountriesSheetKpiRow` (mismos tokens por filterMode).
 */

import { CountriesSheetKpiRow } from '@/components/design-system/countries-sheet-kpi-row';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

export type CountriesKpiRowDemoProps = {
  filterMode?: 'saved' | 'visited';
  variant?: 'card' | 'inline';
  countriesCount?: number;
  placesCount?: number;
  flowsPointsLabel?: string;
};

export function CountriesKpiRowDemo({
  filterMode = 'saved',
  variant = 'card',
  countriesCount = 12,
  placesCount = 48,
  flowsPointsLabel = '2.400',
}: CountriesKpiRowDemoProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(() => {
    const base = Colors[colorScheme ?? 'light'];
    if (filterMode === 'saved') {
      return {
        text: base.text,
        textSecondary: base.textSecondary,
        primary: base.primary,
        panelBg: base.countriesPanelToVisitBackgroundElevated,
        border: base.countriesPanelToVisitBorderSubtle,
      };
    }
    return {
      text: base.text,
      textSecondary: base.textSecondary,
      primary: base.primary,
      panelBg: base.countriesPanelVisitedBackgroundElevated,
      border: base.countriesPanelVisitedBorderSubtle,
    };
  }, [colorScheme, filterMode]);

  const onCountriesKpiPress = variant === 'card' ? () => {} : undefined;
  const onSpotsKpiPress = variant === 'card' ? () => {} : undefined;

  const row = (
    <CountriesSheetKpiRow
      filterMode={filterMode}
      summaryCountriesCount={countriesCount}
      summaryPlacesCount={placesCount}
      pointsLabel={flowsPointsLabel}
      colors={{
        text: colors.text,
        textSecondary: colors.textSecondary,
        primary: colors.primary,
        borderSubtle: colors.border,
        background: colors.panelBg,
        backgroundElevated: colors.panelBg,
      }}
      onCountriesKpiPress={onCountriesKpiPress}
      onSpotsKpiPress={onSpotsKpiPress}
    />
  );

  if (variant === 'inline') {
    return row;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
        },
      ]}
    >
      {row}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    maxWidth: 520,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    overflow: 'hidden',
  },
});
