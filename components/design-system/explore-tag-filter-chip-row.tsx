/**
 * Chips «Cualquiera» + etiquetas (icono Tag); flujo multilínea con `flexWrap` (mapa, modal, vitrina DS).
 * En búsqueda fullscreen el host usa `ExplorePlacesActiveFiltersBar`; esta fila es fallback/vitrina.
 */

import { ExploreTagIconLabel } from "@/components/design-system/explore-tag-icon-label";
import { Colors, Radius, Spacing, WebNoTextSelect } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Trash2 } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

export type ExploreTagFilterOption = {
  id: string;
  name: string;
  count: number;
};

export type ExploreTagFilterChipRowProps = {
  tagFilterOptions: ExploreTagFilterOption[];
  /** Vacío = «Cualquiera» (sin filtro por etiqueta). Varios ids = OR (al menos una etiqueta). */
  selectedTagFilterIds: readonly string[];
  onTagFilterChange: (tagIds: string[]) => void;
  tagFilterEditMode: boolean;
  onTagFilterEnterEditMode?: () => void;
  onTagFilterExitEditMode?: () => void;
  onRequestDeleteUserTag?: (tagId: string, tagName: string) => void;
  /** Alinear al ancho de los filtros del mapa / banda de búsqueda. */
  containerMaxWidth?: number;
  /** `search`: margen bajo para el listado. `map`: sin margen inferior (el host pone gap). */
  variant?: "search" | "map";
};

export function ExploreTagFilterChipRow({
  tagFilterOptions,
  selectedTagFilterIds,
  onTagFilterChange,
  tagFilterEditMode,
  onTagFilterEnterEditMode,
  onTagFilterExitEditMode,
  onRequestDeleteUserTag,
  containerMaxWidth,
  variant = "search",
}: ExploreTagFilterChipRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (tagFilterOptions.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.row,
        variant === "search" ? styles.rowSearch : styles.rowMap,
        containerMaxWidth != null
          ? { maxWidth: containerMaxWidth, alignSelf: "center" }
          : null,
      ]}
      pointerEvents="box-none"
    >
      <View
        key={tagFilterEditMode ? "tag-filter-edit" : "tag-filter-browse"}
        style={styles.chipWrap}
      >
          {!tagFilterEditMode ? (
            <Pressable
              onPress={() => {
                onTagFilterChange([]);
              }}
              style={[
                styles.chip,
                WebNoTextSelect,
                {
                  backgroundColor:
                    selectedTagFilterIds.length === 0
                      ? colors.tint
                      : colors.background,
                  borderColor: colors.borderSubtle,
                },
              ]}
              accessibilityLabel="Sin filtrar por etiqueta"
              accessibilityHint="Puedes activar varias etiquetas; se muestran lugares que tengan al menos una (o)."
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTagFilterIds.length === 0 }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color:
                      selectedTagFilterIds.length === 0
                        ? colors.background
                        : colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                Cualquiera
              </Text>
            </Pressable>
          ) : null}
          {tagFilterOptions.map((opt) => {
            const selected = selectedTagFilterIds.includes(opt.id);
            const chipEditSelected = tagFilterEditMode && selected;
            const chipColors: ViewStyle = {
              backgroundColor: chipEditSelected
                ? colors.stateError
                : selected
                  ? colors.tint
                  : colors.background,
              borderColor: chipEditSelected
                ? colors.stateError
                : colors.borderSubtle,
            };
            const chipLabelColor = chipEditSelected
              ? colors.surfaceOnMap
              : selected
                ? colors.background
                : colors.text;
            const trashIconColor = chipEditSelected
              ? colors.surfaceOnMap
              : tagFilterEditMode
                ? colors.stateError
                : colors.textSecondary;
            return (
              <View
                key={opt.id}
                style={[
                  styles.chip,
                  styles.chipInner,
                  chipColors,
                  WebNoTextSelect,
                ]}
              >
                <Pressable
                  onPress={() => {
                    if (tagFilterEditMode) return;
                    const next = selected
                      ? selectedTagFilterIds.filter((id) => id !== opt.id)
                      : [...selectedTagFilterIds, opt.id];
                    onTagFilterChange(next);
                  }}
                  onLongPress={
                    onTagFilterEnterEditMode != null
                      ? () => {
                          onTagFilterEnterEditMode();
                        }
                      : undefined
                  }
                  delayLongPress={450}
                  style={styles.chipMainPress}
                  accessibilityLabel={`Filtrar por ${opt.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <ExploreTagIconLabel
                    name={opt.name}
                    suffix={opt.count > 0 ? ` (${opt.count})` : ""}
                    color={chipLabelColor}
                    iconSize={12}
                    textStyle={[
                      styles.chipLabel,
                      { color: chipLabelColor },
                    ]}
                    containerStyle={styles.chipIconLabelFill}
                  />
                </Pressable>
                {tagFilterEditMode && onRequestDeleteUserTag != null ? (
                  <Pressable
                    onPress={() => onRequestDeleteUserTag(opt.id, opt.name)}
                    hitSlop={10}
                    style={styles.chipRemove}
                    accessibilityLabel={`Eliminar etiqueta ${opt.name}`}
                    accessibilityRole="button"
                  >
                    <Trash2
                      size={14}
                      color={trashIconColor}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
      </View>
      {tagFilterEditMode && onTagFilterExitEditMode != null ? (
        <Pressable
          onPress={onTagFilterExitEditMode}
          style={({ pressed }) => [
            styles.doneBtn,
            {
              backgroundColor: colors.tint,
              borderColor: colors.tint,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityLabel="Salir del modo edición de etiquetas"
          accessibilityRole="button"
        >
          <Text style={[styles.doneBtnLabel, { color: colors.surfaceOnMap }]}>
            Listo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    width: "100%",
  },
  rowSearch: {
    marginBottom: Spacing.md,
  },
  rowMap: {
    marginBottom: 0,
  },
  /** Multilínea responsiva (modal, mapa, buscador). */
  chipWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    alignContent: "flex-start",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 220,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 260,
  },
  chipMainPress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
  },
  chipIconLabelFill: {
    flex: 1,
    minWidth: 0,
  },
  chipRemove: {
    padding: 2,
    marginLeft: 2,
    flexShrink: 0,
  },
  doneBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexShrink: 0,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        cursor: "pointer" as const,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  doneBtnLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
