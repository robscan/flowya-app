import { TypographyStyles } from "@/components/design-system/typography";
import { Radius, Spacing } from "@/constants/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ExploreBulkTagSelectionBarColors = {
  text: string;
  textSecondary: string;
  borderSubtle: string;
  background: string;
  backgroundElevated: string;
  primary: string;
  surfaceOnMap: string;
};

export type ExploreBulkTagSelectionBarProps = {
  colors: ExploreBulkTagSelectionBarColors;
  selectionMode: boolean;
  selectedCount: number;
  totalCount?: number;
  disabled?: boolean;
  onEnterSelectionMode: () => void;
  onCancelSelectionMode: () => void;
  onAssignTags: () => void;
  onSelectAll?: () => void;
  /** Si true, el CTA de entrada (cuando `selectionMode=false`) se oculta. */
  hideEntryButton?: boolean;
  /** Si true, en modo selección se oculta el botón "Cancelar" del bloque de acciones. */
  hideCancelButton?: boolean;
};

export function ExploreBulkTagSelectionBar({
  colors,
  selectionMode,
  selectedCount,
  totalCount = 0,
  disabled = false,
  onEnterSelectionMode,
  onCancelSelectionMode,
  onAssignTags,
  onSelectAll,
  hideEntryButton = false,
  hideCancelButton = false,
}: ExploreBulkTagSelectionBarProps) {
  if (!selectionMode) {
    if (hideEntryButton) return null;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seleccionar lugares para asignar etiquetas"
        disabled={disabled}
        onPress={onEnterSelectionMode}
        style={({ pressed }) => [
          styles.entryTertiaryTextButton,
          { opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, fontWeight: "700" }]}>
          Seleccionar
        </Text>
      </Pressable>
    );
  }

  const canSelectAll = typeof onSelectAll === "function" && totalCount > 0;
  const allSelected = totalCount > 0 && selectedCount >= totalCount;
  const selectionLabel =
    selectedCount === 0
      ? "Selecciona lugares para etiquetarlos"
      : `${selectedCount} ${selectedCount === 1 ? "lugar seleccionado" : "lugares seleccionados"}`;

  return (
    <View
      style={[
        styles.activeCard,
        {
          borderColor: colors.borderSubtle,
          backgroundColor: colors.backgroundElevated,
        },
      ]}
    >
      <Text style={[TypographyStyles.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
        {selectionLabel}
      </Text>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Asignar etiquetas a la selección"
          disabled={selectedCount === 0}
          onPress={onAssignTags}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity: selectedCount === 0 ? 0.45 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[TypographyStyles.caption, { color: colors.surfaceOnMap, fontWeight: "700" }]}>
            Etiquetar
          </Text>
        </Pressable>
        <View style={styles.actionRowSpacer} />
        {canSelectAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={allSelected ? "Quitar selección de todos" : "Seleccionar todos"}
            onPress={onSelectAll}
            style={({ pressed }) => [styles.selectAllTextButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[TypographyStyles.caption, { color: colors.text, fontWeight: "700" }]}>
              {allSelected ? "Quitar todo" : "Seleccionar todo"}
            </Text>
          </Pressable>
        ) : null}
        {hideCancelButton ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar selección múltiple"
            onPress={onCancelSelectionMode}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.background,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[TypographyStyles.caption, { color: colors.text, fontWeight: "700" }]}>
              Cancelar
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entryTertiaryTextButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  activeCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  selectAllTextButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignSelf: "flex-end",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionRowSpacer: {
    flex: 1,
    minWidth: 0,
  },
  primaryButton: {
    minHeight: 40,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
