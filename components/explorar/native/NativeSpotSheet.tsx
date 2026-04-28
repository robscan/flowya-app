import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/design-system/icon-button";
import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NativeSearchSpot } from "@/lib/explore/native-spot-search";

type NativeSpotSheetProps = {
  spot: NativeSearchSpot | null;
  onClose: () => void;
};

export function NativeSpotSheet({ spot, onClose }: NativeSpotSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <Modal animationType="slide" transparent visible={spot != null} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Cerrar lugar"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        {spot ? (
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.backgroundElevated,
                paddingBottom: insets.bottom + Spacing.lg,
                borderColor: palette.border,
              },
            ]}
          >
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
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
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
