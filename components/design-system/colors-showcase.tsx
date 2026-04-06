/**
 * Design System: showcase de la paleta global de colores.
 * Light y Dark; cada swatch muestra valor (hex/rgba) y ruta en código (Colors.light|dark.*).
 */

import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

const SWATCH_SIZE = 44;
const SWATCH_GAP = Spacing.sm;
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function SwatchRow({
  mode,
  tokens,
}: {
  mode: 'light' | 'dark';
  tokens: { name: string; key: keyof (typeof Colors)['light'] }[];
}) {
  const palette = Colors[mode];
  const labelColor = mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary;
  const codePrefix = mode === 'light' ? 'Colors.light' : 'Colors.dark';

  return (
    <View style={styles.swatchRow}>
      {tokens.map(({ name, key }) => {
        const raw = palette[key] as string;
        return (
          <View key={key} style={styles.swatchItem}>
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: raw,
                  borderColor: labelColor,
                  borderWidth: key === 'background' || key === 'backgroundElevated' ? 1 : 0,
                },
              ]}
            />
            <Text style={[styles.swatchName, { color: labelColor }]} numberOfLines={2}>
              {name}
            </Text>
            <Text style={[styles.valueText, { color: labelColor }]} selectable>
              {raw}
            </Text>
            <Text style={[styles.codeText, { color: labelColor }]} selectable numberOfLines={2}>
              {`${codePrefix}.${String(key)}`}
            </Text>
          </View>
        );
      })}
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
  const countriesToVisitTokens: { name: string; key: keyof (typeof Colors)['light'] }[] = [
    { name: 'countriesPanelToVisitBackground', key: 'countriesPanelToVisitBackground' },
    {
      name: 'countriesPanelToVisitBackgroundElevated',
      key: 'countriesPanelToVisitBackgroundElevated',
    },
    { name: 'countriesPanelToVisitBorder', key: 'countriesPanelToVisitBorder' },
    { name: 'countriesPanelToVisitBorderSubtle', key: 'countriesPanelToVisitBorderSubtle' },
    { name: 'countriesMapCountryBaseToVisit', key: 'countriesMapCountryBaseToVisit' },
    { name: 'countriesMapCountryLineToVisit', key: 'countriesMapCountryLineToVisit' },
    { name: 'countriesCounterToVisitBackground', key: 'countriesCounterToVisitBackground' },
    { name: 'countriesCounterToVisitBorder', key: 'countriesCounterToVisitBorder' },
  ];
  const countriesVisitedTokens: { name: string; key: keyof (typeof Colors)['light'] }[] = [
    { name: 'countriesPanelVisitedBackground', key: 'countriesPanelVisitedBackground' },
    {
      name: 'countriesPanelVisitedBackgroundElevated',
      key: 'countriesPanelVisitedBackgroundElevated',
    },
    { name: 'countriesPanelVisitedBorder', key: 'countriesPanelVisitedBorder' },
    { name: 'countriesPanelVisitedBorderSubtle', key: 'countriesPanelVisitedBorderSubtle' },
    { name: 'countriesMapCountryBaseVisited', key: 'countriesMapCountryBaseVisited' },
    { name: 'countriesMapCountryLineVisited', key: 'countriesMapCountryLineVisited' },
    { name: 'countriesCounterVisitedBackground', key: 'countriesCounterVisitedBackground' },
    { name: 'countriesCounterVisitedBorder', key: 'countriesCounterVisitedBorder' },
  ];

  return (
    <>
      <Text style={[styles.lede, { color: Colors.light.textSecondary }]}>
        Fuente: <Text style={{ fontFamily: MONO }}>constants/theme.ts</Text> — objeto{' '}
        <Text style={{ fontFamily: MONO }}>Colors.light</Text> / <Text style={{ fontFamily: MONO }}>Colors.dark</Text>;
        cada fila muestra el valor resuelto y la ruta de la clave.
      </Text>
      <Text style={[styles.sectionLabel, { color: Colors.light.textSecondary }]}>Paleta Light</Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.light.background }]}>
        <SwatchRow mode="light" tokens={baseTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.dark.textSecondary }]}>Paleta Dark</Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.dark.background }]}>
        <SwatchRow mode="dark" tokens={baseTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.light.textSecondary }]}>
        Tokens: Countries ToVisit (Light)
      </Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.light.background }]}>
        <SwatchRow mode="light" tokens={countriesToVisitTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.dark.textSecondary }]}>
        Tokens: Countries ToVisit (Dark)
      </Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.dark.background }]}>
        <SwatchRow mode="dark" tokens={countriesToVisitTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.light.textSecondary }]}>
        Tokens: Countries Visited (Light)
      </Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.light.background }]}>
        <SwatchRow mode="light" tokens={countriesVisitedTokens} />
      </View>
      <Text style={[styles.sectionLabel, { color: Colors.dark.textSecondary }]}>
        Tokens: Countries Visited (Dark)
      </Text>
      <View style={[styles.modeBlock, { backgroundColor: Colors.dark.background }]}>
        <SwatchRow mode="dark" tokens={countriesVisitedTokens} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lede: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
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
    width: 168,
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  swatchName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: MONO,
  },
});
