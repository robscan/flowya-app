/**
 * Design System: Map-related UI placeholders.
 * Canonical map overlays (marker preview, control group, etc.). No map logic.
 */

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function MapUIShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrapper}>
      <View
        style={{
          ...styles.placeholder,
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text style={{ ...styles.label, color: colors.textSecondary }}>
          Map marker preview (placeholder)
        </Text>
      </View>
      <View
        style={{
          ...styles.placeholder,
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text style={{ ...styles.label, color: colors.textSecondary }}>
          Map control group (placeholder)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.base,
  },
  placeholder: {
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
  },
});
