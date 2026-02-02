/**
 * Design System: showcase de la paleta global de colores.
 * Light y Dark; ejemplos de uso (botones, pines).
 */

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { MapPinLocation, MapPinSpot } from './map-pins';

const SWATCH_SIZE = 40;
const SWATCH_GAP = Spacing.sm;

function SwatchRow({
  mode,
  tokens,
}: {
  mode: 'light' | 'dark';
  tokens: { name: string; key: keyof (typeof Colors)['light'] }[];
}) {
  const colors = Colors[mode];
  const textColor = mode === 'light' ? Colors.light.text : Colors.dark.text;
  const labelColor = mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary;

  return (
    <View style={styles.swatchRow}>
      {tokens.map(({ name, key }) => (
        <View key={key} style={styles.swatchItem}>
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: colors[key] as string,
                borderColor: labelColor,
                borderWidth: key === 'background' || key === 'backgroundElevated' ? 1 : 0,
              },
            ]}
          />
          <Text style={[styles.swatchLabel, { color: labelColor }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ColorsShowcase() {
  const baseTokens: { name: string; key: keyof (typeof Colors)['light'] }[] = [
    { name: 'primary', key: 'primary' },
    { name: 'secondary', key: 'secondary' },
    { name: 'text', key: 'text' },
    { name: 'textSecondary', key: 'textSecondary' },
    { name: 'stateSuccess', key: 'stateSuccess' },
    { name: 'stateToVisit', key: 'stateToVisit' },
    { name: 'background', key: 'background' },
    { name: 'backgroundElevated', key: 'backgroundElevated' },
  ];

  return (
    <>
      <Text style={[styles.sectionLabel, { color: Colors.light.textSecondary }]}>
        Paleta Light
      </Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.light.background }]}>
        <SwatchRow mode="light" tokens={baseTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.dark.textSecondary }]}>
        Paleta Dark
      </Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.dark.background }]}>
        <SwatchRow mode="dark" tokens={baseTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.light.textSecondary }]}>
        Uso: pines (referencian primary, text, stateToVisit, stateSuccess)
      </Text>
      <View style={styles.usageRow}>
        <View style={styles.usageItem}>
          <MapPinLocation colorScheme="light" />
          <Text style={[styles.usageLabel, { color: Colors.light.textSecondary }]}>
            primary
          </Text>
        </View>
        <View style={styles.usageItem}>
          <MapPinSpot status="default" colorScheme="light" />
          <Text style={[styles.usageLabel, { color: Colors.light.textSecondary }]}>
            text
          </Text>
        </View>
        <View style={styles.usageItem}>
          <MapPinSpot status="to_visit" colorScheme="light" />
          <Text style={[styles.usageLabel, { color: Colors.light.textSecondary }]}>
            stateToVisit
          </Text>
        </View>
        <View style={styles.usageItem}>
          <MapPinSpot status="visited" colorScheme="light" />
          <Text style={[styles.usageLabel, { color: Colors.light.textSecondary }]}>
            stateSuccess
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modeBlock: {
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.base,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SWATCH_GAP,
  },
  swatchItem: {
    alignItems: 'center',
    width: SWATCH_SIZE + 60,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  swatchLabel: {
    fontSize: 11,
  },
  usageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  usageItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  usageLabel: {
    fontSize: 11,
  },
});
