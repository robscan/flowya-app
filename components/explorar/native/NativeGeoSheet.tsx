import { Pressable, StyleSheet, Text, View } from "react-native";

import { NativeSheetHeader } from "@/components/explorar/native/NativeSheetHeader";
import { NativeSheetShell } from "@/components/explorar/native/NativeSheetShell";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  buildGeoHierarchyLabel,
  buildGeoSheetSummary,
  formatGeoKind,
  formatGeoMapState,
  formatGeoMarkState,
} from "@/lib/geo/display";
import type { GeoSearchResult, UserGeoMarkState } from "@/lib/geo/types";

type GeoMarkActionState = UserGeoMarkState | "clear";

type NativeGeoSheetProps = {
  geo: GeoSearchResult | null;
  message: string | null;
  savingMark: GeoMarkActionState | null;
  onClose: () => void;
  onSaveMark: (state: UserGeoMarkState) => void;
  onClearMark: () => void;
};

export function NativeGeoSheet({
  geo,
  message,
  savingMark,
  onClose,
  onSaveMark,
  onClearMark,
}: NativeGeoSheetProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const hasMark = geo?.saved === true || geo?.visited === true;
  const markState = geo ? formatGeoMarkState(geo) : "";
  const mapState = geo ? formatGeoMapState(geo) : "";

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
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: palette.background, borderColor: palette.border }]}>
              <Text style={[styles.metaPillText, { color: palette.text }]}>{formatGeoKind(geo)}</Text>
            </View>
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: geo.visited || geo.saved ? palette.primary : palette.background,
                  borderColor: geo.visited || geo.saved ? palette.primary : palette.border,
                },
              ]}
            >
              <Text style={[styles.metaPillText, { color: geo.visited || geo.saved ? "#FFFFFF" : palette.text }]}>
                {markState}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: palette.background, borderColor: palette.border }]}>
            <Text style={[styles.summaryTitle, { color: palette.text }]}>Destino</Text>
            <Text style={[styles.summaryText, { color: palette.textSecondary }]}>
              {buildGeoSheetSummary(geo)}
            </Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: palette.background, borderColor: palette.border }]}>
              <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Jerarquía</Text>
              <Text style={[styles.infoValue, { color: palette.text }]} numberOfLines={2}>
                {buildGeoHierarchyLabel(geo)}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: palette.background, borderColor: palette.border }]}>
              <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Mapa</Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>{mapState}</Text>
            </View>
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
          {hasMark ? (
            <Pressable
              accessibilityRole="button"
              disabled={savingMark != null}
              onPress={onClearMark}
              style={[
                styles.clearButton,
                {
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.clearText, { color: palette.text }]}>
                {savingMark === "clear" ? "Quitando..." : "Quitar"}
              </Text>
            </Pressable>
          ) : null}
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
    marginTop: Spacing.md,
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  metaPill: {
    minHeight: 30,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  infoGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  infoCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    padding: Spacing.sm,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 2,
  },
  clearButton: {
    minHeight: 42,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
