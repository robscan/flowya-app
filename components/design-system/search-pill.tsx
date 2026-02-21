/**
 * Design System: SearchPill.
 * Entry point para abrir búsqueda en Explore. Estilo Apple Maps: pill con icono + label.
 * Variant "onDark" para contraste sobre cluster flotante oscuro (BottomDock).
 */

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

/** Colores fijos para pill sobre fondo oscuro (cluster flotante estilo Apple Maps). */
const ON_DARK_BG = '#ffffff';
const ON_DARK_BG_PRESSED = 'rgba(0, 0, 0, 0.06)';
const ON_DARK_TEXT = '#1d1d1f';
const ON_DARK_BORDER = 'rgba(0, 0, 0, 0.08)';

/** Ancho mínimo que acomoda "Buscar spots" + icono + padding sin colapso. */
const PILL_MIN_WIDTH = 150;

export type SearchPillVariant = 'default' | 'onDark';

export type SearchPillProps = {
  /** Label del pill (default "Buscar spots"). */
  label?: string;
  onPress: () => void;
  /** Override para accessibility (default = label). */
  accessibilityLabel?: string;
  /** Si true, el pill crece para llenar espacio (flex: 1). Default false = ancho al contenido. */
  fill?: boolean;
  /** onDark: fondo blanco y texto oscuro para contraste sobre cluster flotante. */
  variant?: SearchPillVariant;
  testID?: string;
};

export function SearchPill({
  label = 'Buscar spots',
  onPress,
  accessibilityLabel,
  fill = false,
  variant = 'default',
  testID,
}: SearchPillProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focused, setFocused] = useState(false);

  const isOnDark = variant === 'onDark';
  const backgroundColor = isOnDark
    ? (pressed: boolean) => (pressed ? ON_DARK_BG_PRESSED : ON_DARK_BG)
    : (pressed: boolean) => (pressed ? colors.borderSubtle : colors.background);
  const borderColor = isOnDark ? ON_DARK_BORDER : colors.borderSubtle;
  const textColor = isOnDark ? ON_DARK_TEXT : colors.textSecondary;
  const iconColor = isOnDark ? ON_DARK_TEXT : colors.textSecondary;

  const focusStyle =
    Platform.OS === 'web'
      ? {
          outlineWidth: 0 as const,
          outlineStyle: 'none' as const,
          ...(focused && {
            boxShadow:
              colorScheme === 'dark'
                ? '0 0 0 2px rgba(41,151,255,0.35)'
                : '0 0 0 2px rgba(0,113,227,0.35)',
          }),
        }
      : {};

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.pill,
        fill && styles.pillFill,
        {
          backgroundColor: backgroundColor(pressed),
          borderColor,
        },
        WebTouchManipulation,
        focusStyle,
        Platform.OS === 'web' && { cursor: 'pointer' },
      ]}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <Search size={20} color={iconColor} strokeWidth={2} />
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minWidth: PILL_MIN_WIDTH,
    flexShrink: 0,
  },
  pillFill: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    flexShrink: 0,
  },
});
