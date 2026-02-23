/**
 * Design System: filtro visual de pins en el mapa.
 * Dropdown estilo Apple Mail: trigger con valor actual + menú con Todos | Por visitar | Visitados.
 * Solo afecta visibilidad de pins; no modifica datos ni estado.
 * Opcional: counts para mostrar número junto a Por visitar y Visitados.
 * Animaciones: menú scale+opacity al desplegar; LayoutAnimation al cambiar valor; pulse en trigger.
 */

import { CheckCircle, ChevronDown, ChevronUp, Globe, Pin } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

import { TypographyStyles } from './typography';

const DROPDOWN_DURATION_MS = 200;
const DROPDOWN_EASING = Easing.out(Easing.cubic);
const PULSE_DURATION_MS = 120;

export type MapPinFilterValue = 'all' | 'saved' | 'visited';

const OPTIONS: { value: MapPinFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'saved', label: 'Por visitar' },
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
  }
}

export function MapPinFilter({ value, onChange, counts }: MapPinFilterProps) {
  const [open, setOpen] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const prevValueRef = useRef(value);

  const openProgress = useSharedValue(0);
  const triggerScale = useSharedValue(1);

  useEffect(() => {
    openProgress.value = withTiming(open ? 1 : 0, {
      duration: DROPDOWN_DURATION_MS,
      easing: DROPDOWN_EASING,
    });
  }, [open, openProgress]);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      triggerScale.value = withSequence(
        withTiming(1.04, { duration: PULSE_DURATION_MS, easing: DROPDOWN_EASING }),
        withTiming(1, { duration: PULSE_DURATION_MS, easing: DROPDOWN_EASING })
      );
    }
  }, [value, triggerScale]);

  const getSelectedColors = (optValue: MapPinFilterValue) => {
    switch (optValue) {
      case 'all':
        return { bg: colors.text, text: colors.background };
      case 'saved':
        return { bg: colors.stateToVisit, text: '#ffffff' };
      case 'visited':
        return { bg: colors.stateSuccess, text: '#ffffff' };
    }
  };

  const selectedColors = getSelectedColors(value);
  const currentLabel = OPTIONS.find((o) => o.value === value)!.label;
  const triggerCount = getCount(value, counts);

  const handleSelect = (optValue: MapPinFilterValue) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(optValue);
    setOpen(false);
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
    transform: [
      { scale: 0.96 + openProgress.value * 0.04 },
      { translateY: (1 - openProgress.value) * -4 },
    ],
  }));

  const triggerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={triggerAnimatedStyle}>
        <Pressable
          style={[
            styles.trigger,
            {
              backgroundColor: selectedColors.bg,
              borderColor: colors.borderSubtle,
            },
            Platform.OS === 'web' && { cursor: 'pointer' },
          ]}
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`Filtro: ${getLabelWithCount(value, currentLabel, counts)}. Toca para ${open ? 'cerrar' : 'abrir'} menú.`}
        >
          <FilterIcon value={value} size={18} color={selectedColors.text} />
          <Text
            style={[
              TypographyStyles.filterLabel,
              { color: selectedColors.text },
            ]}
            numberOfLines={1}
          >
            {currentLabel}
          </Text>
          {triggerCount != null ? (
            <View
              style={[
                styles.countBadge,
                styles.triggerCountBadge,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Text
                style={[styles.countBadgeText, { color: colors.text }]}
                numberOfLines={1}
              >
                {triggerCount}
              </Text>
            </View>
          ) : null}
          {open ? (
            <ChevronUp size={18} color={selectedColors.text} strokeWidth={2} />
          ) : (
            <ChevronDown size={18} color={selectedColors.text} strokeWidth={2} />
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[styles.backdrop, backdropAnimatedStyle, { pointerEvents: open ? 'auto' : 'none' }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
          accessibilityLabel="Cerrar menú"
        />
      </Animated.View>
      <View style={[styles.menuContainer, { pointerEvents: open ? 'auto' : 'none' }]}>
        <Animated.View
          style={[
            styles.menu,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
            },
            menuAnimatedStyle,
          ]}
        >
          {OPTIONS.map((opt) => {
            const count = getCount(opt.value, counts);
            return (
              <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.menuOption,
                    {
                      backgroundColor: pressed ? colors.borderSubtle : 'transparent',
                    },
                    Platform.OS === 'web' && { cursor: 'pointer' },
                  ]}
                  onPress={() => handleSelect(opt.value)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: value === opt.value }}
                  accessibilityLabel={getLabelWithCount(opt.value, opt.label, counts)}
                >
                  <FilterIcon
                    value={opt.value}
                    size={18}
                    color={colors.text}
                  />
                  <Text
                    style={[
                      TypographyStyles.filterLabel,
                      { color: colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {count != null ? (
                    <View
                      style={[
                        styles.countBadge,
                        {
                          backgroundColor: colors.text,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countBadgeText,
                          { color: colors.background },
                        ]}
                        numberOfLines={1}
                      >
                        {count}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
        </Animated.View>
      </View>
    </View>
  );
}

const BACKDROP_INSET = 9999;

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: -BACKDROP_INSET,
    left: -BACKDROP_INSET,
    right: -BACKDROP_INSET,
    bottom: -BACKDROP_INSET,
    zIndex: 10,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    alignItems: 'center',
    zIndex: 20,
  },
  menu: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 180,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  triggerCountBadge: {
    marginLeft: 0,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
