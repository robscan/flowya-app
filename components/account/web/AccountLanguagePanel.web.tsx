import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Text, View } from "react-native";

export function AccountLanguagePanelWeb() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={{ width: "100%", gap: Spacing.md }}>
      <Text style={[TypographyStyles.body, { color: colors.text }]}>Próximamente.</Text>
      <Text style={[TypographyStyles.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
        Aquí podrás elegir el idioma de Flowya cuando esté disponible.
      </Text>
    </View>
  );
}
