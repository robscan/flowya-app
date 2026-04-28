import { StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { IconButton } from "@/components/design-system/icon-button";
import { TypographyStyles } from "@/components/design-system/typography";
import { NativeSheetShell } from "@/components/explorar/native/NativeSheetShell";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NativeSearchSpot } from "@/lib/explore/native-spot-search";

type NativeSpotSheetProps = {
  spot: NativeSearchSpot | null;
  onClose: () => void;
};

export function NativeSpotSheet({ spot, onClose }: NativeSpotSheetProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <NativeSheetShell visible={spot != null} closeLabel="Cerrar lugar" onClose={onClose}>
      {spot ? (
        <>
            <View style={styles.header}>
              <View style={styles.titleGroup}>
                <Text style={[TypographyStyles.heading3, { color: palette.text }]} numberOfLines={2}>
                  {spot.title}
                </Text>
                <Text style={[styles.hint, { color: palette.textSecondary }]}>Lugar del mapa</Text>
              </View>
              <IconButton accessibilityLabel="Cerrar lugar" onPress={onClose} size={40}>
                <X size={20} color={palette.text} strokeWidth={2.2} />
              </IconButton>
            </View>
        </>
      ) : null}
    </NativeSheetShell>
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
  hint: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
