/**
 * Launcher “tap to search” (sin foco hasta abrir el panel). En Explorar, la pastilla canónica en mapa/sidebar/KPI
 * es `ExploreChromeSearchField` (compone este componente con `variant="onMap"`).
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Search } from 'lucide-react-native';

export type SearchLauncherFieldVariant = 'default' | 'onMap';

export type SearchLauncherFieldProps = {
  onPress: () => void;
  placeholder?: string;
  accessibilityLabel?: string;
  variant?: SearchLauncherFieldVariant;
  placeholderColor?: string;
  testID?: string;
};

const MAP_BG = '#ffffff';
const MAP_BORDER = 'rgba(0, 0, 0, 0.08)';
const MAP_BG_PRESSED = 'rgba(255,255,255,0.92)';

export function SearchLauncherField({
  onPress,
  placeholder = 'Descubre lugares, ciudades o zonas',
  accessibilityLabel,
  variant = 'onMap',
  placeholderColor,
  testID,
}: SearchLauncherFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focused, setFocused] = useState(false);

  const isOnMap = variant === 'onMap';
  const restingBackground = isOnMap ? MAP_BG : colors.backgroundElevated;
  const restingBorder = isOnMap ? MAP_BORDER : colors.borderSubtle;
  // El launcher on-map usa fondo blanco en light y dark; el placeholder debe contrastar
  // contra esa superficie, no contra el tema global de la app.
  const onMapPlaceholderColor = 'rgba(60,60,67,0.72)';
  const textColor = placeholderColor ?? (isOnMap ? onMapPlaceholderColor : colors.textSecondary);
  const iconColor = placeholderColor ?? (isOnMap ? onMapPlaceholderColor : colors.textSecondary);
  const pressedBackground = isOnMap ? MAP_BG_PRESSED : colors.background;

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
        styles.field,
        {
          backgroundColor: pressed ? pressedBackground : restingBackground,
          borderColor: restingBorder,
        },
        WebTouchManipulation,
        focusStyle,
        Platform.OS === 'web' && { cursor: 'pointer' as const },
      ]}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? placeholder}
    >
      <View style={styles.content}>
        <Search size={20} color={iconColor} strokeWidth={2} />
        <Text style={[styles.placeholder, { color: textColor }]} numberOfLines={1}>
          {placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    ...Shadow.subtle,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
  },
  placeholder: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
  },
});
