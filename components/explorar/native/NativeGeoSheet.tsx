import { Pressable, StyleSheet, Text, View } from "react-native";

import { NativeSheetHeader } from "@/components/explorar/native/NativeSheetHeader";
import { NativeSheetShell } from "@/components/explorar/native/NativeSheetShell";
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
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <NativeSheetShell visible={geo != null} closeLabel="Cerrar ficha" onClose={onClose}>
      {geo ? (
        <>
          <NativeSheetHeader
            title={geo.title}
            subtitle={`${formatGeoKind(geo)}${geo.subtitle ? ` · ${geo.subtitle}` : ""}`}
            closeLabel="Cerrar ficha"
            onClose={onClose}
          />
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
        </>
      ) : null}
    </NativeSheetShell>
  );
}

const styles = StyleSheet.create({
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
