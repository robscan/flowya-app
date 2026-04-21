/**
 * Etiquetas — plataformas no web: stub (paridad con `tags.web.tsx`).
 */

import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountTagsScreenNative() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.lg,
          paddingHorizontal: Spacing.lg,
        },
      ]}
    >
      <Text style={[TypographyStyles.heading3, { color: colors.text, marginBottom: Spacing.sm }]}>
        Etiquetas
      </Text>
      <Text style={[TypographyStyles.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>
        La administración completa de etiquetas está disponible en la versión web por ahora.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={[TypographyStyles.body, { fontWeight: "600", color: colors.primary }]}>Volver</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});
