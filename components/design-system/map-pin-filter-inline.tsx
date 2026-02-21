/**
 * Design System: filtro de pins en formato inline (una sola fila).
 * Variante para panel de búsqueda: tres pills visibles sin dropdown.
 * Mismo contrato y diseño que MapPinFilter (iconos, colores, counts).
 * Animaciones: pulse al cambiar filtro; LayoutAnimation para transición de layout.
 * NO modifica MapPinFilter existente; uso exclusivo en SearchFloating.
 */

import { CheckCircle, Globe, Pin } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import type { MapPinFilterCounts, MapPinFilterValue } from './map-pin-filter';
import { TypographyStyles } from './typography';

const PULSE_DURATION_MS = 120;
const PULSE_EASING = Easing.out(Easing.cubic);

const OPTIONS: { value: MapPinFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'saved', label: 'Por visitar' },
  { value: 'visited', label: 'Visitados' },
];

function getCount(optValue: MapPinFilterValue, counts?: MapPinFilterCounts): number | undefined {
  if (optValue === 'all' || !counts) return undefined;
  return optValue === 'saved' ? counts.saved : counts.visited;
}

function FilterIcon({
  value,
  size,
  color,
}: {
  value: MapPinFilterValue;
  size: number;
  color: string;
}) {
  switch (value) {
    case 'all':
      return <Globe size={size} color={color} strokeWidth={2} />;
    case 'saved':
      return <Pin size={size} color={color} strokeWidth={2} />;
    case 'visited':
      return <CheckCircle size={size} color={color} strokeWidth={2} />;
    default:
      return null;
  }
}

export type MapPinFilterInlineProps = {
  value: MapPinFilterValue;
  onChange: (value: MapPinFilterValue) => void;
  counts?: MapPinFilterCounts;
};

export function MapPinFilterInline({ value, onChange, counts }: MapPinFilterInlineProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const prevValueRef = useRef(value);
  const selectedScale = useSharedValue(1);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      selectedScale.value = withSequence(
        withTiming(1.04, { duration: PULSE_DURATION_MS, easing: PULSE_EASING }),
        withTiming(1, { duration: PULSE_DURATION_MS, easing: PULSE_EASING })
      );
    }
  }, [value, selectedScale]);

  const handleSelect = (optValue: MapPinFilterValue) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(optValue);
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectedScale.value }],
  }));

  const getSelectedColors = (optValue: MapPinFilterValue) => {
    switch (optValue) {
      case 'all':
        return { bg: colors.text, text: colors.background, border: colors.text };
      case 'saved':
        return { bg: colors.stateToVisit, text: '#ffffff', border: colors.stateToVisit };
      case 'visited':
        return { bg: colors.stateSuccess, text: '#ffffff', border: colors.stateSuccess };
      default:
        return { bg: colors.borderSubtle, text: colors.text, border: colors.borderSubtle };
    }
  };

  const getUnselectedColors = () => ({
    bg: colors.backgroundElevated ?? colors.background,
    text: colors.text,
    border: colors.borderSubtle,
  });

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        const count = getCount(opt.value, counts);
        const pillColors = isSelected ? getSelectedColors(opt.value) : getUnselectedColors();
        const label = opt.label;

        const pillContent = (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: pillColors.bg,
                borderColor: isSelected ? pillColors.bg : pillColors.border,
                opacity: pressed ? 0.85 : 1,
              },
              Platform.OS === 'web' && { cursor: 'pointer' },
            ]}
            onPress={() => handleSelect(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${label}${count != null ? ` ${count}` : ''}`}
          >
            <FilterIcon value={opt.value} size={16} color={pillColors.text} />
            {isSelected ? (
              <Text
                style={[TypographyStyles.filterLabel, { color: pillColors.text }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            ) : null}
            {count != null ? (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected ? colors.background : colors.text,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: isSelected ? colors.text : colors.background },
                  ]}
                  numberOfLines={1}
                >
                  {count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );

        return isSelected ? (
          <Animated.View key={opt.value} style={pulseAnimatedStyle}>
            {pillContent}
          </Animated.View>
        ) : (
          pillContent
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'nowrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
