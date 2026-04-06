import { ChevronRight } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ExploreCountriesFlowsPillProps = {
  countriesCount: number;
  flowsPoints: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Por defecto es-MX (paridad MapScreen). */
  numberLocale?: string;
};

/**
 * Pastilla del mapa Explore: «N países | M flows» + chevron al extremo derecho (sheet visitados).
 * Si `countriesCount === 0`, estado deshabilitado (sin navegación).
 */
export function ExploreCountriesFlowsPill({
  countriesCount,
  flowsPoints,
  onPress,
  accessibilityLabel = 'Abrir países visitados',
  numberLocale = 'es-MX',
}: ExploreCountriesFlowsPillProps) {
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const colors = Colors[resolvedScheme];

  const disabled = countriesCount === 0;
  const canPress = Boolean(onPress) && !disabled;
  const { countriesStr, flowsStr } = useMemo(() => {
    const nf = new Intl.NumberFormat(numberLocale);
    return {
      countriesStr: nf.format(countriesCount),
      flowsStr: nf.format(flowsPoints),
    };
  }, [countriesCount, flowsPoints, numberLocale]);

  const textColor = disabled ? colors.textSecondary : colors.text;
  const chevronColor = disabled ? colors.textSecondary : colors.primary;
  const borderColor = disabled ? colors.borderSubtle : colors.borderSubtle;
  const bgColor = colors.backgroundElevated ?? colors.background;

  return (
    <Pressable
      onPress={onPress}
      disabled={!canPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity: disabled ? 0.72 : pressed && canPress ? 0.88 : 1,
        },
        Platform.OS === 'web' && canPress ? styles.interactive : null,
      ]}
    >
      <View style={styles.inner}>
        <Text style={[styles.metric, { color: textColor }]} numberOfLines={1}>
          {countriesStr} países{' '}
          <Text style={{ color: colors.textSecondary }}>| </Text>
          {flowsStr} flows
        </Text>
        <ChevronRight size={14} color={chevronColor} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 28,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    ...Shadow.subtle,
  },
  interactive: {
    cursor: 'pointer',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  metric: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
