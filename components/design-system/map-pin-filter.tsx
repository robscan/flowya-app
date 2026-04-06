/**
 * Design System: filtro visual de pins en el mapa.
 * Dropdown estilo Apple Mail: trigger con valor actual + menú con Todos | Por visitar | Visitados.
 * Solo afecta visibilidad de pins; no modifica datos ni estado.
 * Opcional: counts para mostrar número junto a Por visitar y Visitados.
 * Animaciones: menú scale+opacity al desplegar; LayoutAnimation al cambiar valor; pulse en trigger.
 */

import { CheckCircle, ChevronDown, ChevronUp, Globe, Pin } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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
import { MapPinFilterMenuOption } from './map-pin-filter-menu-option';

const DROPDOWN_DURATION_MS = 200;
const DROPDOWN_EASING = Easing.out(Easing.cubic);
const PULSE_DURATION_MS = 120;
/** Padding simétrico en trigger y menú; hitSlop refuerza táctil sin minHeight. */
const TRIGGER_HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 } as const;
const MENU_OPTION_HIT_SLOP = { top: 4, bottom: 4, left: 2, right: 2 } as const;
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
  /** Notifica cuando el menú desplegable abre o cierra (p. ej. para retirar overlays que quedan por encima en z-order). */
  onOpenChange?: (open: boolean) => void;
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

function getFilterAccessibilityLabel(
  optValue: MapPinFilterValue,
  label: string,
  counts?: MapPinFilterCounts
): string {
  if (optValue === 'all' || !counts) return label;
  const n = optValue === 'saved' ? counts.saved : counts.visited;
  return `${label}, ${n} lugares`;
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
  onOpenChange,
}: MapPinFilterProps) {
  const [open, setOpen] = useState(false);
  /** Ancho del bloque trigger (chip + clear) para minWidth del menú y centrado estable. */
  const [anchorBlockWidth, setAnchorBlockWidth] = useState(0);
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const colors = Colors[resolvedScheme];
  const { width: windowWidth } = useWindowDimensions();
  const menuMaxWidth = Math.max(0, windowWidth - 32);
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

  const closeMenu = () => {
    setOpen((prev) => {
      if (prev) onOpenChange?.(false);
      return false;
    });
  };

  const handleSelect = (optValue: MapPinFilterValue) => {
    if (optValue === value) {
      closeMenu();
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(optValue);
    closeMenu();
  };

  const handleResetToAll = () => {
    if (value === 'all') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange('all');
    closeMenu();
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
        <View
          style={styles.triggerRow}
          onLayout={(e) => setAnchorBlockWidth(e.nativeEvent.layout.width)}
        >
          <Pressable
            style={[
              styles.trigger,
              {
                backgroundColor: selectedColors.bg,
                borderColor: selectedColors.border,
              },
              Platform.OS === 'web' && { cursor: 'pointer' },
            ]}
            hitSlop={TRIGGER_HIT_SLOP}
            onPress={() => {
              setOpen((o) => {
                const next = !o;
                onOpenChange?.(next);
                return next;
              });
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`Filtro: ${getFilterAccessibilityLabel(value, currentLabel, counts)}. ${INTENTION_BY_FILTER[value]}. Toca para ${open ? 'cerrar' : 'abrir'} menú.`}
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
            />
          ) : null}
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.backdrop, backdropAnimatedStyle, { pointerEvents: open ? 'auto' : 'none' }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeMenu}
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
            { maxWidth: menuMaxWidth },
            anchorBlockWidth > 0 && { minWidth: anchorBlockWidth },
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
            const countNode =
              count != null ? (
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
                  <Text style={[styles.countBadgeText, { color: countBadgeColors.text }]} numberOfLines={1}>
                    {count}
                  </Text>
                </View>
              ) : undefined;
            const pendingNode = optionPending ? (
              <View
                style={[
                  styles.pendingDot,
                  {
                    backgroundColor: colors.stateToVisit,
                    borderColor: colors.backgroundElevated,
                  },
                ]}
              />
            ) : undefined;
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
                hitSlop={MENU_OPTION_HIT_SLOP}
                disabled={isDisabled}
                onPress={() => handleSelect(opt.value)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                accessibilityLabel={getLabelWithCount(opt.value, opt.label, counts)}
              >
                <MapPinFilterMenuOption
                  label={opt.label}
                  labelColor={colors.text}
                  leadingIcon={<FilterIcon value={opt.value} size={18} color={colors.text} />}
                  countBadge={countNode}
                  pendingDot={pendingNode}
                />
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
  /** Ancho = fila del trigger (chip + opcional clear); el menú se centra respecto a este bloque. */
  wrapper: {
    alignSelf: 'center',
    flexShrink: 0,
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
    alignSelf: 'center',
    gap: Spacing.sm,
    maxWidth: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
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
    alignSelf: 'center',
    alignItems: 'stretch',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuOption: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    justifyContent: 'center',
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
});
