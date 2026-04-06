/**
 * Design System: filtro de pins en formato inline (una sola fila).
 * Variante para panel de búsqueda: tres pills visibles sin dropdown.
 * Mismo contrato y diseño que MapPinFilter (iconos, colores, counts).
 * Animaciones: pulse al cambiar filtro; LayoutAnimation para transición de layout.
 * NO modifica MapPinFilter existente; uso exclusivo en SearchFloating.
 */

import { CheckCircle, Globe, Pin } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
/** Altura = contenido + padding simétrico; hitSlop refuerza el área táctil sin inflar top/bottom. */
const PILL_COMPACT_HIT_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };
const PILL_WIDE_HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 };
const DEFAULT_WIDE_MIN_WIDTH = 350;
const FILTER_SELECTED_TO_VISIT = Colors.dark.stateToVisit;
const FILTER_SELECTED_VISITED = Colors.dark.stateSuccess;

const OPTIONS: { value: MapPinFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'saved', label: 'Por visitar' },
  { value: 'visited', label: 'Visitados' },
];

/** Alineado a `map-pin-filter`: sin badge ni número cuando el conteo es 0. */
function getCount(optValue: MapPinFilterValue, counts?: MapPinFilterCounts): number | undefined {
  if (optValue === 'all' || !counts) return undefined;
  const value = optValue === 'saved' ? counts.saved : counts.visited;
  return value > 0 ? value : undefined;
}

function getFilterAccessibilityLabel(label: string, count?: number, disabled?: boolean): string {
  const base = count == null ? label : `${label}, ${count} lugares`;
  if (disabled) return `${base}. No disponible, sin lugares`;
  return base;
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
  layout?: 'compact' | 'wide' | 'auto';
  availableWidth?: number;
  wideMinWidth?: number;
  showCountBadgesInWide?: boolean;
};

export function MapPinFilterInline({
  value,
  onChange,
  counts,
  layout = 'compact',
  availableWidth,
  wideMinWidth = DEFAULT_WIDE_MIN_WIDTH,
  showCountBadgesInWide = true,
}: MapPinFilterInlineProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const colors = Colors[resolvedScheme];
  const prevValueRef = useRef(value);
  const selectedScale = useSharedValue(1);
  const effectiveAvailableWidth = availableWidth ?? viewportWidth;
  const resolvedLayout =
    layout === 'auto'
      ? effectiveAvailableWidth >= wideMinWidth
        ? 'wide'
        : 'compact'
      : layout;
  const showAllLabels = resolvedLayout === 'wide';
  const rowStyle = showAllLabels ? styles.rowWide : styles.row;

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

  const isOptionDisabled = (optValue: MapPinFilterValue): boolean =>
    optValue !== 'all' &&
    counts != null &&
    ((optValue === 'saved' && counts.saved === 0) ||
      (optValue === 'visited' && counts.visited === 0));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectedScale.value }],
  }));

  /** Negro en light para contraste sobre fondo naranja/verde (por visitar/visitados). */
  const chipTextOnColored = resolvedScheme === 'light' ? '#1d1d1f' : colors.pin.default;

  const getSelectedColors = (optValue: MapPinFilterValue) => {
    switch (optValue) {
      case 'all':
        return { bg: colors.text, text: colors.background, border: colors.text };
      case 'saved':
        return {
          bg: FILTER_SELECTED_TO_VISIT,
          text: chipTextOnColored,
          border: FILTER_SELECTED_TO_VISIT,
        };
      case 'visited':
        return {
          bg: FILTER_SELECTED_VISITED,
          text: chipTextOnColored,
          border: FILTER_SELECTED_VISITED,
        };
      default:
        return { bg: colors.borderSubtle, text: colors.text, border: colors.borderSubtle };
    }
  };

  const getUnselectedColors = () => ({
    bg: colors.backgroundElevated ?? colors.background,
    text: colors.text,
    border: colors.borderSubtle,
  });
  const countBadgeColors =
    resolvedScheme === 'light'
      ? {
          background: colors.surfaceMuted,
          text: colors.text,
          border: colors.borderSubtle,
        }
      : {
          background: colors.surfaceOnMap,
          text: colors.pin.default,
          border: 'rgba(255,255,255,0.16)',
        };

  return (
    <View style={rowStyle}>
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        const count = getCount(opt.value, counts);
        const isDisabled = isOptionDisabled(opt.value);
        const pillColors = isSelected ? getSelectedColors(opt.value) : getUnselectedColors();
        const label = opt.label;
        const useAllIconSizer = !showAllLabels && opt.value === 'all' && !isSelected;
        const shouldShowCount =
          count != null &&
          !isSelected &&
          (resolvedLayout === 'compact' || showCountBadgesInWide);
        const isCompactSelected = !showAllLabels && isSelected;

        const pillContent = (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.pill,
              showAllLabels ? styles.pillWide : null,
              {
                backgroundColor: pillColors.bg,
                borderColor: isSelected ? pillColors.bg : pillColors.border,
                opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
              },
              Platform.OS === 'web' && !isDisabled && { cursor: 'pointer' as const },
            ]}
            hitSlop={showAllLabels ? PILL_WIDE_HIT_SLOP : PILL_COMPACT_HIT_SLOP}
            disabled={isDisabled}
            onPress={() => handleSelect(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled: isDisabled }}
            accessibilityLabel={getFilterAccessibilityLabel(label, count, isDisabled)}
          >
            {useAllIconSizer ? (
              <View style={styles.allIconSizer}>
                <FilterIcon value={opt.value} size={16} color={pillColors.text} />
              </View>
            ) : (
              <FilterIcon value={opt.value} size={16} color={pillColors.text} />
            )}
            {showAllLabels || isSelected ? (
              <Text
                style={[
                  TypographyStyles.filterLabel,
                  isCompactSelected ? styles.labelCompactSelected : null,
                  showAllLabels ? styles.labelWide : null,
                  { color: pillColors.text },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            ) : null}
            {shouldShowCount ? (
              <View
                style={[
                  styles.countBadge,
                  showAllLabels ? styles.countBadgeWide : null,
                  {
                    backgroundColor: countBadgeColors.background,
                    borderColor: countBadgeColors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: countBadgeColors.text },
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
  rowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  /** Mismo padding en los cuatro lados (compact y base); activo/inactivo no cambia el recuadro. */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  /** Amplio: mismo recuadro activo / inactivo (solo cambian color y contenido). */
  pillWide: {
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  /** Inline amplio: mismo cuerpo tipográfico en activo e inactivo (solo cambia color de `pillColors`). */
  labelWide: {
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  labelCompactSelected: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  allIconSizer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeWide: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
