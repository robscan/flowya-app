/**
 * Design System: filtro visual de pins en el mapa.
 * Tres opciones: Todos | Guardados | Visitados.
 * Solo afecta visibilidad de pins; no modifica datos ni estado.
 * Opcional: counts para mostrar número junto a Guardados y Visitados.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type MapPinFilterValue = 'all' | 'saved' | 'visited';

const OPTIONS: { value: MapPinFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'saved', label: 'Guardados' },
  { value: 'visited', label: 'Visitados' },
];

export type MapPinFilterCounts = {
  saved: number;
  visited: number;
};

export type MapPinFilterProps = {
  value: MapPinFilterValue;
  onChange: (value: MapPinFilterValue) => void;
  /** Conteos opcionales (derivados del estado, sin queries extra). */
  counts?: MapPinFilterCounts;
};

function getLabelWithCount(
  optValue: MapPinFilterValue,
  label: string,
  counts?: MapPinFilterCounts
): string {
  if (optValue === 'all') return label;
  if (!counts) return label;
  const n = optValue === 'saved' ? counts.saved : counts.visited;
  return `${label} ${n}`;
}

export function MapPinFilter({ value, onChange, counts }: MapPinFilterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getSelectedColors = (optValue: MapPinFilterValue) => {
    const isSelected = value === optValue;
    if (!isSelected) return { bg: 'transparent', text: colors.text };
    switch (optValue) {
      case 'all':
        return { bg: colors.text, text: colors.background };
      case 'saved':
        return { bg: colors.stateToVisit, text: '#ffffff' };
      case 'visited':
        return { bg: colors.stateSuccess, text: '#ffffff' };
    }
  };

  return (
    <View style={styles.wrapper}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        const { bg, text } = getSelectedColors(opt.value);
        return (
          <Pressable
            key={opt.value}
            style={[styles.optionWrap, { backgroundColor: selected ? bg : 'transparent' }]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: selected ? text : colors.text },
              ]}
            >
              {getLabelWithCount(opt.value, opt.label, counts)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  optionWrap: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
