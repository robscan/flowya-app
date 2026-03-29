import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ExploreFlowsBadgeProps = {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function ExploreFlowsBadge({
  label,
  onPress,
  accessibilityLabel = 'Abrir países visitados',
}: ExploreFlowsBadgeProps) {
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const colors = Colors[resolvedScheme];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.badge,
        {
          backgroundColor: colors.backgroundElevated ?? colors.background,
          borderColor: colors.borderSubtle,
          opacity: pressed && onPress ? 0.88 : 1,
        },
        Platform.OS === 'web' && onPress ? styles.interactive : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 28,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.subtle,
  },
  interactive: {
    cursor: 'pointer',
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
