/**
 * Design System: Typography.
 * Jerarquía clara: títulos, cuerpo, metadata. Moderna y legible.
 */

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
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
    fontFamily: Fonts.sans,
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  heading2: {
    fontFamily: Fonts.sans,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  heading3: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  /** Apple Maps style: labels de filtro (más grande y delgado). */
  filterLabel: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '300',
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.base,
  },
});
