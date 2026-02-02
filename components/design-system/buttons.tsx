/**
 * Design System: Buttons.
 * Primary y secondary minimalistas. Sin estilos pesados.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ButtonsShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => ({
          ...styles.primary,
          backgroundColor: colors.tint,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={styles.primaryLabel}>Primary</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => ({
          ...styles.secondary,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ ...styles.secondaryLabel, color: colors.text }}>Secondary</Text>
      </Pressable>
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
    fontWeight: '500',
  },
  secondaryLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
});
