/**
 * Design System: filtro visual de pins en el mapa.
 * Tres opciones: Todos | Por visitar | Visitados.
 * Solo afecta visibilidad de pins; no modifica datos ni estado.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type MapPinFilterValue = 'all' | 'to_visit' | 'visited';

const OPTIONS: { value: MapPinFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'to_visit', label: 'Por visitar' },
  { value: 'visited', label: 'Visitados' },
];

export type MapPinFilterProps = {
  value: MapPinFilterValue;
  onChange: (value: MapPinFilterValue) => void;
};

export function MapPinFilter({ value, onChange }: MapPinFilterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View dataSet={{ flowya: 'map-pin-filter' }} style={styles.wrapper}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            dataSet={{ flowya: `map-pin-filter-${opt.value}` }}
            style={[
              styles.optionWrap,
              { backgroundColor: selected ? colors.tint : 'transparent' },
            ]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: selected ? colors.background : colors.text },
              ]}
            >
              {opt.label}
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
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
