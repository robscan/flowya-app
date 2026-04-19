/**
 * Fila KPI del sheet de países: países · lugares · flows (CountriesSheet).
 */

import { ChevronDown, ChevronRight, List } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Shadow, Spacing } from '@/constants/theme';

export type CountriesSheetKpiRowColors = {
  text: string;
  textSecondary: string;
  primary: string;
  borderSubtle: string;
  /** Borde chips accionables; por defecto se usa `borderSubtle`. */
  borderInteractive?: string;
  background: string;
  backgroundElevated: string;
};

export type CountriesSheetKpiRowProps = {
  filterMode: 'saved' | 'visited';
  summaryCountriesCount: number;
  summaryPlacesCount: number;
  /** Flows ya formateados (es-MX), como en runtime. */
  pointsLabel: string;
  colors: CountriesSheetKpiRowColors;
  onCountriesKpiPress?: () => void;
  onSpotsKpiPress?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
  /**
   * Sheet móvil en `expanded`: mismo tap que en `medium`, pero aspecto de “plegar”
   * (borde + icono en color de línea / acento).
   */
  countriesKpiExpanded?: boolean;
  /** Borde e icono del KPI países en modo expandido (p. ej. línea del mapa preview o `border` del panel). */
  countriesKpiExpandedAccentColor?: string;
};

export function CountriesSheetKpiRow({
  filterMode,
  summaryCountriesCount,
  summaryPlacesCount,
  pointsLabel,
  colors,
  onCountriesKpiPress,
  onSpotsKpiPress,
  onLayout,
  countriesKpiExpanded = false,
  countriesKpiExpandedAccentColor,
}: CountriesSheetKpiRowProps) {
  const countriesIsButton = onCountriesKpiPress != null;
  const placesIsButton = onSpotsKpiPress != null;
  const chipBorder = colors.borderInteractive ?? colors.borderSubtle;
  const countriesExpandedAccent =
    countriesKpiExpandedAccentColor ?? colors.borderInteractive ?? colors.primary;
  const countriesCircleBorder = countriesKpiExpanded && countriesIsButton ? countriesExpandedAccent : chipBorder;
  return (
    <View style={styles.summaryWrap} onLayout={onLayout}>
      <Pressable
        onPress={onCountriesKpiPress}
        disabled={onCountriesKpiPress == null}
        style={({ pressed }) => [
          styles.kpiCircle,
          countriesIsButton
            ? {
                borderColor: countriesCircleBorder,
                backgroundColor: colors.backgroundElevated,
                opacity: pressed ? 0.86 : 1,
                ...(Platform.OS === 'web' ? ({ cursor: 'pointer', ...Shadow.subtle } as const) : null),
              }
            : null,
        ]}
        accessibilityRole={onCountriesKpiPress ? 'button' : undefined}
        accessibilityLabel={
          onCountriesKpiPress
            ? countriesKpiExpanded
              ? 'Plegar lista de países'
              : 'Ver lista completa de países'
            : undefined
        }
      >
        <View style={styles.kpiValueRow}>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{summaryCountriesCount}</Text>
          {countriesIsButton ? (
            <View
              accessible={false}
              {...(Platform.OS === "web"
                ? ({ "aria-hidden": true } as object)
                : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" })}
            >
              {countriesKpiExpanded ? (
                <ChevronDown size={14} color={countriesExpandedAccent} strokeWidth={2.2} />
              ) : (
                <List size={14} color={colors.primary} strokeWidth={2.2} />
              )}
            </View>
          ) : null}
        </View>
        <Text style={[styles.kpiLabel, styles.kpiLabelBelow, { color: colors.textSecondary }]}>
          países
        </Text>
      </Pressable>
      <Pressable
        onPress={onSpotsKpiPress}
        disabled={onSpotsKpiPress == null}
        style={({ pressed }) => [
          styles.kpiCircle,
          placesIsButton
            ? {
                borderColor: chipBorder,
                backgroundColor: colors.backgroundElevated,
                opacity: pressed ? 0.86 : 1,
                ...(Platform.OS === 'web' ? ({ cursor: 'pointer', ...Shadow.subtle } as const) : null),
              }
            : null,
        ]}
        accessibilityRole={onSpotsKpiPress ? 'button' : undefined}
        accessibilityLabel={onSpotsKpiPress ? 'Ver listado de lugares en el sheet' : undefined}
      >
        <View style={styles.kpiValueRow}>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{summaryPlacesCount}</Text>
          {placesIsButton ? (
            <View
              accessible={false}
              {...(Platform.OS === "web"
                ? ({ "aria-hidden": true } as object)
                : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" })}
            >
              <ChevronRight size={14} color={colors.primary} strokeWidth={2.2} />
            </View>
          ) : null}
        </View>
        <Text style={[styles.kpiLabel, styles.kpiLabelBelow, { color: colors.textSecondary }]}>
          lugares
        </Text>
      </Pressable>
      <View style={styles.summaryChip}>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{pointsLabel}</Text>
        {filterMode === 'visited' ? (
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>flows</Text>
        ) : (
          <View style={styles.flowsCaptionStack}>
            <Text style={[styles.flowsCaptionLine, styles.flowsCaptionLineUpper, { color: colors.textSecondary }]}>
              FLOWS
            </Text>
            <Text style={[styles.flowsCaptionLine, { color: colors.textSecondary }]}>Por obtener</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  kpiCircle: {
    flex: 1,
    minWidth: 64,
    height: 64,
    paddingHorizontal: 6,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.subtle,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  kpiLabelBelow: {
    marginTop: 1,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryChip: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  /** Modo por visitar: «FLOWS» / «Por obtener» en dos líneas, centrado. */
  flowsCaptionStack: {
    alignItems: 'center',
    marginTop: 1,
    gap: 0,
  },
  flowsCaptionLine: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'none',
  },
  flowsCaptionLineUpper: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
