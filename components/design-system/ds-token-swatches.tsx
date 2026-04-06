import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Elevation, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/** Espaciado (`Spacing.*`) desde `constants/theme.ts`. */
export function DsSpacingSwatches() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const spacingEntries = Object.entries(Spacing) as [keyof typeof Spacing, number][];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.lede, { color: colors.textSecondary }]}>
        Ritmo vertical y horizontal en px. Uso: <Text style={{ fontFamily: MONO }}>Spacing.md</Text>,{' '}
        <Text style={{ fontFamily: MONO }}>Spacing.base</Text>, etc.
      </Text>
      <View style={styles.rowWrap}>
        {spacingEntries.map(([key, value]) => (
          <View
            key={key}
            style={[styles.chip, { borderColor: colors.borderSubtle, backgroundColor: colors.backgroundElevated }]}
          >
            <Text style={[styles.chipKey, { color: colors.textSecondary }]}>{String(key)}</Text>
            <Text style={[styles.chipVal, { color: colors.text }]}>{value}px</Text>
            <Text style={[styles.chipCode, { color: colors.textSecondary }]} selectable>
              Spacing.{String(key)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Radios de esquina (`Radius.*`) desde `constants/theme.ts`. */
export function DsRadiusSwatches() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const radiusEntries = Object.entries(Radius) as [keyof typeof Radius, number][];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.lede, { color: colors.textSecondary }]}>
        Border radius en px. <Text style={{ fontFamily: MONO }}>Radius.pill</Text> reserva el valor 9999 para forma
        píldora.
      </Text>
      <View style={styles.rowWrap}>
        {radiusEntries.map(([key, value]) => (
          <View key={key} style={styles.radiusItem}>
            <View
              style={[
                styles.radiusPreview,
                {
                  borderRadius: value >= 9999 ? 9999 : value,
                  backgroundColor: colors.tint,
                  width: value >= 9999 ? 72 : 56,
                  height: value >= 9999 ? 32 : 56,
                },
              ]}
            />
            <Text style={[styles.chipKey, { color: colors.textSecondary, marginTop: Spacing.xs }]}>{String(key)}</Text>
            <Text style={[styles.chipVal, { color: colors.text }]}>{value >= 9999 ? '9999 (pill)' : `${value}px`}</Text>
            <Text style={[styles.chipCode, { color: colors.textSecondary }]} selectable>
              Radius.{String(key)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ELEVATION_KEYS = ['subtle', 'card', 'raised'] as const;

/** Elevación / sombra (`Elevation.*`). `Shadow` es el mismo objeto (alias). */
export function DsElevationSwatches() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.lede, { color: colors.textSecondary }]}>
        Superficies elevadas: en documentación y guías suele llamarse <Text style={{ fontWeight: '600' }}>elevación</Text>{' '}
        (p. ej. Material); en código exportamos <Text style={{ fontFamily: MONO }}>Elevation.subtle</Text>,{' '}
        <Text style={{ fontFamily: MONO }}>Elevation.card</Text>, <Text style={{ fontFamily: MONO }}>Elevation.raised</Text>
        . El nombre histórico <Text style={{ fontFamily: MONO }}>Shadow.*</Text> apunta al mismo objeto (mismas claves) para
        no romper <Text style={{ fontFamily: MONO }}>...Shadow.subtle</Text> existentes.
      </Text>
      <View style={styles.elevationList}>
        {ELEVATION_KEYS.map((key) => {
          const ev = Elevation[key];
          return (
            <View key={key} style={styles.elevationRow}>
              <View
                style={[
                  styles.elevationCard,
                  { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle },
                  ev,
                ]}
              >
                <Text style={[styles.elevationCardLabel, { color: colors.textSecondary }]}>{key}</Text>
              </View>
              <View style={styles.elevationMeta}>
                <Text style={[styles.metaLine, { color: colors.text }]} selectable>
                  <Text style={styles.metaStrong}>Token: </Text>
                  <Text style={{ fontFamily: MONO, fontSize: 11 }}>Elevation.{key}</Text>
                </Text>
                <Text style={[styles.metaLine, { color: colors.textSecondary, fontSize: 11 }]} selectable>
                  Alias: Shadow.{key}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  lede: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 88,
  },
  chipKey: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipVal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  chipCode: {
    fontSize: 9,
    fontFamily: MONO,
    marginTop: 4,
    lineHeight: 12,
  },
  radiusItem: {
    alignItems: 'center',
    minWidth: 88,
    marginBottom: Spacing.sm,
  },
  radiusPreview: {
    alignSelf: 'center',
  },
  elevationList: {
    gap: Spacing.lg,
  },
  elevationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.base,
  },
  elevationCard: {
    width: 120,
    minHeight: 72,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elevationCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  elevationMeta: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  metaLine: {
    fontSize: 12,
    lineHeight: 18,
  },
  metaStrong: {
    fontWeight: '600',
  },
});
