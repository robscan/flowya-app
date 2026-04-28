import { StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { IconButton } from "@/components/design-system/icon-button";
import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type NativeSheetHeaderProps = {
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
};

export function NativeSheetHeader({
  title,
  subtitle,
  closeLabel,
  onClose,
}: NativeSheetHeaderProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.header}>
      <View style={styles.titleGroup}>
        <Text style={[TypographyStyles.heading3, { color: palette.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: palette.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <IconButton accessibilityLabel={closeLabel} onPress={onClose} size={40}>
        <X size={20} color={palette.text} strokeWidth={2.2} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
