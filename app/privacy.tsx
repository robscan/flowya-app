import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TypographyStyles } from '@/components/design-system/typography';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  PRIVACY_POLICY_LAST_UPDATED_ES,
  PRIVACY_POLICY_SECTIONS_ES,
} from '@/lib/legal/privacy-policy-es';

/**
 * Política de privacidad pública — OL-PRIVACY-001.
 * Ruta: /privacy
 */
export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.sm,
            paddingBottom: insets.bottom + Spacing.xxl,
          },
        ]}
        accessibilityLabel="Política de privacidad"
      >
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.base }]}>
          Última actualización: {PRIVACY_POLICY_LAST_UPDATED_ES}
        </Text>
        {PRIVACY_POLICY_SECTIONS_ES.map((section) => (
          <View key={section.title} style={styles.block}>
            <Text style={[TypographyStyles.heading3, { color: colors.text, marginBottom: Spacing.sm }]}>
              {section.title}
            </Text>
            {section.paragraphs.map((p, i) => (
              <Text
                key={`${section.title}-${i}`}
                style={[styles.paragraph, { color: colors.textSecondary }]}
              >
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  block: {
    marginBottom: Spacing.lg,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
});
