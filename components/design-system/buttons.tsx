/**
 * Design System: Buttons.
 * Primary y secondary con estados pressed canónicos.
 * No usar opacity como feedback.
 * Web: touch-action manipulation evita zoom por doble tap.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ButtonPrimaryProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Web: dataSet para QA */
  dataSet?: Record<string, string>;
};

export function ButtonPrimary({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  dataSet,
}: ButtonPrimaryProps) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <Pressable
      dataSet={dataSet}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: disabled ? colors.primary : pressed ? colors.text : colors.primary,
        },
        WebTouchManipulation,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text style={styles.primaryLabel}>{children}</Text>
    </Pressable>
  );
}

export type ButtonSecondaryProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Web: dataSet para QA */
  dataSet?: Record<string, string>;
};

export function ButtonSecondary({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  dataSet,
}: ButtonSecondaryProps) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <Pressable
      dataSet={dataSet}
      style={({ pressed }) => [
        styles.secondary,
        {
          borderColor: colors.border,
          backgroundColor: pressed && !disabled ? colors.backgroundElevated : 'transparent',
        },
        WebTouchManipulation,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text style={[styles.secondaryLabel, { color: colors.text }]}>{children}</Text>
    </Pressable>
  );
}

export function ButtonsShowcase() {
  return (
    <View style={styles.wrapper}>
      <ButtonPrimary>Primary</ButtonPrimary>
      <ButtonSecondary>Secondary</ButtonSecondary>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.base,
  },
  primary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  secondary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
});
