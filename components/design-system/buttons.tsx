/**
 * Design System: Buttons.
 * Primary y secondary con estados pressed canónicos.
 * No usar opacity como feedback.
 * Web: touch-action manipulation evita zoom por doble tap.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ButtonPrimaryProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

export function ButtonPrimary({
  children,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonPrimaryProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const colors = Colors[useColorScheme() ?? 'light'];
  const interactiveDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: interactiveDisabled
            ? colors.primary
            : pressed
              ? colors.tintPressed
              : hovered && Platform.OS === 'web'
                ? colors.tintPressed
                : colors.primary,
          opacity: interactiveDisabled ? 0.6 : 1,
        },
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
        WebTouchManipulation,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={interactiveDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: interactiveDisabled, busy: loading }}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text style={styles.primaryLabel}>{children}</Text>
      </View>
    </Pressable>
  );
}

export type ButtonSecondaryProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

export function ButtonSecondary({
  children,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonSecondaryProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const colors = Colors[useColorScheme() ?? 'light'];
  const interactiveDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondary,
        {
          borderColor: colors.border,
          backgroundColor: pressed && !interactiveDisabled
            ? colors.stateSurfacePressed
            : hovered && Platform.OS === 'web'
              ? colors.stateSurfaceHover
              : 'transparent',
          opacity: interactiveDisabled ? 0.6 : 1,
        },
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
        WebTouchManipulation,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={interactiveDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: interactiveDisabled, busy: loading }}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color={colors.text} /> : null}
        <Text style={[styles.secondaryLabel, { color: colors.text }]}>{children}</Text>
      </View>
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
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  secondary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
