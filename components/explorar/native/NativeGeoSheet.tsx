import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/design-system/icon-button";
import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatGeoKind } from "@/lib/geo/display";
import type { GeoSearchResult, UserGeoMarkState } from "@/lib/geo/types";

type NativeGeoSheetProps = {
  geo: GeoSearchResult | null;
  message: string | null;
  savingMark: UserGeoMarkState | null;
  onClose: () => void;
  onSaveMark: (state: UserGeoMarkState) => void;
};

export function NativeGeoSheet({
  geo,
  message,
  savingMark,
  onClose,
  onSaveMark,
}: NativeGeoSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <Modal animationType="slide" transparent visible={geo != null} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Cerrar ficha"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        {geo ? (
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
                  {geo.title}
                </Text>
                <Text style={[styles.hint, { color: palette.textSecondary }]}>
                  {formatGeoKind(geo)}
                  {geo.subtitle ? ` · ${geo.subtitle}` : ""}
                </Text>
              </View>
              <IconButton accessibilityLabel="Cerrar ficha" onPress={onClose} size={40}>
                <X size={20} color={palette.text} strokeWidth={2.2} />
              </IconButton>
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={savingMark != null}
                onPress={() => onSaveMark("saved")}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: geo.saved ? palette.primary : palette.background,
                    borderColor: geo.saved ? palette.primary : palette.border,
                  },
                ]}
              >
                <Text style={[styles.actionText, { color: geo.saved ? "#FFFFFF" : palette.text }]}>
                  {savingMark === "saved" ? "Guardando..." : "Por visitar"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={savingMark != null}
                onPress={() => onSaveMark("visited")}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: geo.visited ? palette.primary : palette.background,
                    borderColor: geo.visited ? palette.primary : palette.border,
                  },
                ]}
              >
                <Text style={[styles.actionText, { color: geo.visited ? "#FFFFFF" : palette.text }]}>
                  {savingMark === "visited" ? "Guardando..." : "Visitado"}
                </Text>
              </Pressable>
            </View>
            {message ? (
              <Text style={[styles.message, { color: palette.textSecondary }]}>{message}</Text>
            ) : null}
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
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
