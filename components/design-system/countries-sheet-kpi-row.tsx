/**
 * Fila KPI del sheet de países: países · lugares · flows (CountriesSheet).
 */

import type { CountriesSheetState } from '@/components/design-system/countries-sheet-types';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Spacing } from '@/constants/theme';

export type CountriesSheetKpiRowColors = {
  text: string;
  textSecondary: string;
  primary: string;
  borderSubtle: string;
  background: string;
  backgroundElevated: string;
};

export type CountriesSheetKpiRowProps = {
  filterMode: 'saved' | 'visited';
  summaryCountriesCount: number;
  summaryPlacesCount: number;
  /** Flows ya formateados (es-MX), como en runtime. */
  pointsLabel: string;
  colors: CountriesSheetKpiRowColors;
  sheetState: CountriesSheetState;
  onCountriesKpiPress?: () => void;
  onSpotsKpiPress?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

export function CountriesSheetKpiRow({
  filterMode,
  summaryCountriesCount,
  summaryPlacesCount,
  pointsLabel,
  colors,
  sheetState,
  onCountriesKpiPress,
  onSpotsKpiPress,
  onLayout,
}: CountriesSheetKpiRowProps) {
  const countriesIsButton = onCountriesKpiPress != null;
  const placesIsButton = onSpotsKpiPress != null;
  return (
    <View style={styles.summaryWrap} onLayout={onLayout}>
      <Pressable
        onPress={onCountriesKpiPress}
        disabled={onCountriesKpiPress == null}
        style={({ pressed }) => [
          styles.summaryChip,
          countriesIsButton ? styles.summaryChipButton : null,
          countriesIsButton
            ? {
                borderColor: colors.borderSubtle,
                backgroundColor: pressed ? colors.backgroundElevated : colors.background,
                ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : null),
              }
            : null,
        ]}
        accessibilityRole={onCountriesKpiPress ? 'button' : undefined}
        accessibilityLabel={onCountriesKpiPress ? 'Ver lista completa de países' : undefined}
      >
        <Text style={[styles.summaryValue, { color: colors.text }]}>{summaryCountriesCount}</Text>
        <View style={styles.kpiLabelRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>países</Text>
          {countriesIsButton && sheetState === 'peek' ? (
            <ChevronRight size={14} color={colors.primary} strokeWidth={2.2} />
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onSpotsKpiPress}
        disabled={onSpotsKpiPress == null}
        style={({ pressed }) => [
          styles.summaryChip,
          placesIsButton ? styles.summaryChipButton : null,
          placesIsButton
            ? {
                borderColor: colors.borderSubtle,
                backgroundColor: pressed ? colors.backgroundElevated : colors.background,
                ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : null),
              }
            : null,
        ]}
        accessibilityRole={onSpotsKpiPress ? 'button' : undefined}
        accessibilityLabel={onSpotsKpiPress ? 'Ver listado de lugares en el sheet' : undefined}
      >
        <Text style={[styles.summaryValue, { color: colors.text }]}>{summaryPlacesCount}</Text>
        <View style={styles.kpiLabelRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>lugares</Text>
          {placesIsButton && sheetState === 'peek' ? (
            <ChevronRight size={14} color={colors.primary} strokeWidth={2.2} />
          ) : null}
        </View>
      </Pressable>
      <View style={styles.summaryChip}>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{pointsLabel}</Text>
        {filterMode === 'visited' ? (
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>flows</Text>
        ) : (
          <View style={styles.flowsCaptionStack}>
            <Text style={[styles.flowsCaptionLine, styles.flowsCaptionLineUpper, { color: colors.textSecondary }]}>
              FLOWS
            </Text>
            <Text style={[styles.flowsCaptionLine, { color: colors.textSecondary }]}>Por obtener</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  summaryChip: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryChipButton: {
    borderWidth: 1,
    borderRadius: 12,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  summaryValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  /** Modo por visitar: «FLOWS» / «Por obtener» en dos líneas, centrado. */
  flowsCaptionStack: {
    alignItems: 'center',
    marginTop: 1,
    gap: 0,
  },
  flowsCaptionLine: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'none',
  },
  flowsCaptionLineUpper: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
