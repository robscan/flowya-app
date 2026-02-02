/**
 * Design System: Cards / containers.
 * Bordes suaves, sombra muy sutil, mucho aire.
 */

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function CardsShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrapper}>
      <View
        style={{
          ...styles.card,
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          ...Shadow.subtle,
        }}
      >
        <Text style={{ ...styles.cardTitle, color: colors.text }}>Card</Text>
        <Text style={{ ...styles.cardBody, color: colors.textSecondary }}>
          Container for content. Soft border, very subtle shadow.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.base,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    lineHeight: 28,
  },
  cardBody: {
    fontSize: 17,
    lineHeight: 26,
  },
});
