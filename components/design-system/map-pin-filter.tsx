/**
 * Design System: filtro visual de pins en el mapa.
 * Dropdown estilo Apple Mail: trigger con valor actual + menú con Todos | Por visitar | Visitados.
 * Solo afecta visibilidad de pins; no modifica datos ni estado.
 * Opcional: counts para mostrar número junto a Por visitar y Visitados.
 * Animaciones: menú scale+opacity al desplegar; LayoutAnimation al cambiar valor; pulse en trigger.
 */

import { Check, CheckCircle, ChevronDown, ChevronUp, Globe, Pin } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
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

import { TypographyStyles } from './typography';

import { ClearIconCircle } from './clear-icon-circle';

const DROPDOWN_DURATION_MS = 200;
const DROPDOWN_EASING = Easing.out(Easing.cubic);
const PULSE_DURATION_MS = 120;
const MIN_TOUCH_TARGET = 44;
const FILTER_SELECTED_TO_VISIT = Colors.dark.stateToVisit;
const FILTER_SELECTED_VISITED = Colors.dark.stateSuccess;

export type MapPinFilterValue = 'all' | 'saved' | 'visited';

const OPTIONS: { value: MapPinFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'saved', label: 'Por visitar' },
  { value: 'visited', label: 'Visitados' },
];

/** OL-WOW-F2-003: intención explícita por filtro (a11y, toast). */
export const INTENTION_BY_FILTER: Record<MapPinFilterValue, string> = {
  all: 'Explora y planea',
  saved: 'Planea, viaja y organiza',
  visited: 'Recuerda y registra memorias',
};

export type MapPinFilterCounts = {
  saved: number;
  visited: number;
};

export type MapPinFilterProps = {
  value: MapPinFilterValue;
  onChange: (value: MapPinFilterValue) => void;
  /** Conteos opcionales (derivados del estado, sin queries extra). */
  counts?: MapPinFilterCounts;
  pendingValues?: Partial<Record<Exclude<MapPinFilterValue, 'all'>, boolean>>;
  pulseNonce?: number;
  menuPlacement?: 'down' | 'up';
  /** Oculta contador del valor activo en trigger para evitar redundancia con overlays externos. */
  hideActiveCount?: boolean;
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
  const value = optValue === 'saved' ? counts.saved : counts.visited;
  return value > 0 ? value : undefined;
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

export function MapPinFilter({
  value,
  onChange,
  counts,
  pendingValues = {},
  pulseNonce = 0,
  menuPlacement = 'down',
  hideActiveCount = false,
}: MapPinFilterProps) {
  const [open, setOpen] = useState(false);
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const colors = Colors[resolvedScheme];
  const prevValueRef = useRef(value);
  const prevPulseNonceRef = useRef(pulseNonce);

  const openProgress = useSharedValue(0);
  const triggerScale = useSharedValue(1);

  useEffect(() => {
    openProgress.value = withTiming(open ? 1 : 0, {
      duration: DROPDOWN_DURATION_MS,
      easing: DROPDOWN_EASING,
    });
  }, [open, openProgress]);

  useEffect(() => {
    const valueChanged = prevValueRef.current !== value;
    const pulseRequested = prevPulseNonceRef.current !== pulseNonce;
    if (valueChanged || pulseRequested) {
      prevValueRef.current = value;
      prevPulseNonceRef.current = pulseNonce;
      triggerScale.value = withSequence(
        withTiming(1.04, { duration: PULSE_DURATION_MS, easing: DROPDOWN_EASING }),
        withTiming(1, { duration: PULSE_DURATION_MS, easing: DROPDOWN_EASING })
      );
    }
  }, [value, pulseNonce, triggerScale]);

  const getSelectedColors = (optValue: MapPinFilterValue) => {
    switch (optValue) {
      case 'all':
        return { bg: colors.text, text: colors.background, border: colors.borderSubtle };
      case 'saved':
        return {
          bg: FILTER_SELECTED_TO_VISIT,
          text: colors.pin.default,
          border: FILTER_SELECTED_TO_VISIT,
        };
      case 'visited':
        return {
          bg: FILTER_SELECTED_VISITED,
          text: colors.pin.default,
          border: FILTER_SELECTED_VISITED,
        };
    }
  };

  const selectedColors = getSelectedColors(value);
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
  const currentLabel = OPTIONS.find((o) => o.value === value)!.label;
  const triggerCount = hideActiveCount ? undefined : getCount(value, counts);
  const hasPendingAny = Boolean(pendingValues.saved || pendingValues.visited);

  const handleSelect = (optValue: MapPinFilterValue) => {
    if (optValue === value) {
      setOpen(false);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(optValue);
    setOpen(false);
  };

  const handleResetToAll = () => {
    if (value === 'all') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange('all');
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
        <View style={styles.triggerRow}>
          <Pressable
            style={[
              styles.trigger,
              styles.triggerFlex,
              {
                backgroundColor: selectedColors.bg,
                borderColor: selectedColors.border,
              },
              Platform.OS === 'web' && { cursor: 'pointer' },
            ]}
            onPress={() => setOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`Filtro: ${getLabelWithCount(value, currentLabel, counts)}. ${INTENTION_BY_FILTER[value]}. Toca para ${open ? 'cerrar' : 'abrir'} menú.`}
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
                    backgroundColor: countBadgeColors.background,
                    borderColor: countBadgeColors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.countBadgeText, { color: countBadgeColors.text }]}
                  numberOfLines={1}
                >
                  {triggerCount}
                </Text>
              </View>
            ) : null}
            {value === 'all' && hasPendingAny ? (
              <View
                style={[
                  styles.pendingDot,
                  styles.triggerPendingDotFloating,
                  {
                    backgroundColor: colors.stateToVisit,
                    borderColor: selectedColors.bg,
                  },
                ]}
              />
            ) : null}
            {open ? (
              <ChevronUp size={18} color={selectedColors.text} strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color={selectedColors.text} strokeWidth={2} />
            )}
          </Pressable>
          {value !== 'all' ? (
            <ClearIconCircle
              onPress={handleResetToAll}
              accessibilityLabel="Volver a Todos"
              iconColor={colors.pin.outline}
              backgroundColor={selectedColors.bg}
              variant="filter"
            />
          ) : null}
        </View>
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
      <View
        style={[
          styles.menuContainer,
          menuPlacement === 'up' ? styles.menuContainerUp : styles.menuContainerDown,
          { pointerEvents: open ? 'auto' : 'none' },
        ]}
      >
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
            const optionPending =
              opt.value === 'all'
                ? hasPendingAny
                : opt.value === 'saved'
                  ? Boolean(pendingValues.saved)
                  : Boolean(pendingValues.visited);
            const isDisabled =
              opt.value !== 'all' &&
              counts != null &&
              ((opt.value === 'saved' && counts.saved === 0) ||
                (opt.value === 'visited' && counts.visited === 0));
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }): ViewStyle[] => [
                  styles.menuOption,
                  ...(isSelected
                    ? ([{ borderLeftWidth: 3, borderLeftColor: colors.tint }] as const)
                    : ([] as const)),
                  {
                    backgroundColor: isDisabled
                      ? 'transparent'
                      : pressed && !isSelected
                        ? colors.borderSubtle
                        : isSelected
                          ? colors.surfaceMuted
                          : 'transparent',
                    opacity: isDisabled ? 0.45 : 1,
                  },
                  ...(Platform.OS === 'web'
                    ? ([{ cursor: isDisabled ? ('auto' as const) : ('pointer' as const) }] as const)
                    : ([] as const)),
                ]}
                disabled={isDisabled}
                onPress={() => handleSelect(opt.value)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                accessibilityLabel={getLabelWithCount(opt.value, opt.label, counts)}
              >
                <View style={styles.menuOptionRow}>
                  <View style={styles.menuOptionLeading}>
                    <FilterIcon value={opt.value} size={18} color={colors.text} />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        TypographyStyles.filterLabel,
                        styles.menuOptionLabel,
                        { color: colors.text },
                        Platform.OS === 'web' && ({ whiteSpace: 'nowrap' } as TextStyle),
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <View style={styles.menuRightSlot}>
                    {count != null ? (
                      <View
                        style={[
                          styles.countBadge,
                          styles.menuCountBadge,
                          {
                            backgroundColor: countBadgeColors.background,
                            borderColor: countBadgeColors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.countBadgeText, { color: countBadgeColors.text }]}
                          numberOfLines={1}
                        >
                          {count}
                        </Text>
                      </View>
                    ) : null}
                    {optionPending ? (
                      <View
                        style={[
                          styles.pendingDot,
                          styles.menuPendingDotFloating,
                          {
                            backgroundColor: colors.stateToVisit,
                            borderColor: colors.backgroundElevated,
                          },
                        ]}
                      />
                    ) : null}
                    {isSelected ? (
                      <Check size={18} color={colors.tint} strokeWidth={2.5} />
                    ) : (
                      <View style={styles.menuCheckPlaceholder} />
                    )}
                  </View>
                </View>
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
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  triggerFlex: {
    flex: 1,
    minWidth: 0,
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  menuContainerDown: {
    top: '100%',
    marginTop: Spacing.xs,
  },
  menuContainerUp: {
    bottom: '100%',
    marginBottom: Spacing.xs,
  },
  menu: {
    alignSelf: 'flex-start',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 288,
    maxWidth: '100%',
  },
  menuOption: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    justifyContent: 'center',
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
  },
  menuOptionLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
  },
  menuOptionLabel: {
    flexShrink: 1,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
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
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  triggerPendingDotFloating: {
    position: 'absolute',
    right: 30,
    top: 10,
  },
  menuCountBadge: {
    marginLeft: 0,
  },
  menuRightSlot: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    minHeight: 28,
    position: 'relative',
  },
  menuPendingDotFloating: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  menuCheckPlaceholder: {
    width: 18,
    height: 18,
  },
});
