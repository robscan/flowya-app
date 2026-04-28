import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type V1DomainPlaceholderScreenProps = {
  title: string;
  status: string;
};

export function V1DomainPlaceholderScreen({ title, status }: V1DomainPlaceholderScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + 88,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[TypographyStyles.heading2, styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[TypographyStyles.body, styles.status, { color: colors.textSecondary }]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    marginBottom: Spacing.sm,
  },
  status: {
    maxWidth: 280,
  },
});
