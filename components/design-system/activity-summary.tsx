import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ActivitySummaryProps = {
  visitedPlacesCount: number;
  pendingPlacesCount: number;
  visitedCountriesCount: number | null;
  isLoading?: boolean;
  mode?: 'full' | 'countries-only';
};

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function ActivitySummary({
  visitedPlacesCount,
  pendingPlacesCount,
  visitedCountriesCount,
  isLoading = false,
  mode = 'full',
}: ActivitySummaryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isLoading) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando resumen...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Resumen de actividad. Países visitados: ${
        visitedCountriesCount ?? 'sin dato'
      }, lugares visitados: ${visitedPlacesCount}, pendientes: ${pendingPlacesCount}.`}
    >
      <Metric
        label="Países visitados"
        value={visitedCountriesCount == null ? '—' : String(visitedCountriesCount)}
      />
      {mode === 'full' ? (
        <>
          <Metric label="Lugares visitados" value={String(visitedPlacesCount)} />
          <Metric label="Pendientes" value={String(pendingPlacesCount)} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
