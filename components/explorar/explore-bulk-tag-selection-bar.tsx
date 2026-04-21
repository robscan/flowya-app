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
  disabled?: boolean;
  onEnterSelectionMode: () => void;
  onCancelSelectionMode: () => void;
  onAssignTags: () => void;
};

export function ExploreBulkTagSelectionBar({
  colors,
  selectionMode,
  selectedCount,
  disabled = false,
  onEnterSelectionMode,
  onCancelSelectionMode,
  onAssignTags,
}: ExploreBulkTagSelectionBarProps) {
  if (!selectionMode) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seleccionar lugares para asignar etiquetas"
        disabled={disabled}
        onPress={onEnterSelectionMode}
        style={({ pressed }) => [
          styles.entryButton,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.backgroundElevated,
            opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={[TypographyStyles.caption, { color: colors.text, fontWeight: "700" }]}>
          Seleccionar lugares
        </Text>
      </Pressable>
    );
  }

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
  },
  activeCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
