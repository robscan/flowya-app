/**
 * Design System: Typography.
 * Jerarquía clara: títulos, cuerpo, metadata. Moderna y legible.
 */

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function TypographyShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrapper}>
      <Text style={{ ...TypographyStyles.heading1, color: colors.text }}>Heading 1</Text>
      <Text style={{ ...TypographyStyles.heading2, color: colors.text }}>Heading 2</Text>
      <Text style={{ ...TypographyStyles.heading3, color: colors.text }}>Heading 3</Text>
      <Text style={{ ...TypographyStyles.body, color: colors.text }}>
        Body text. Use for paragraphs and default content. Enough line height for readability.
      </Text>
      <Text style={{ ...TypographyStyles.caption, color: colors.textSecondary }}>Caption or metadata</Text>
    </View>
  );
}

/** Estilos canónicos para uso en otros componentes. */
export const TypographyStyles = StyleSheet.create({
  heading1: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  heading2: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  heading3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.base,
  },
});
