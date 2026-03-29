import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { TypographyStyles } from './typography';

export type FlowyaFeedbackTriggerProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  label?: string;
};

export function FlowyaFeedbackTrigger({
  onPress,
  accessibilityLabel = 'FLOWYA Beta',
  label = 'FLOWYA',
}: FlowyaFeedbackTriggerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.pressable,
        WebTouchManipulation,
        Platform.OS === 'web' && { cursor: 'pointer' as const },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[TypographyStyles.heading2, styles.label, { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 28,
    lineHeight: 28,
  },
});
