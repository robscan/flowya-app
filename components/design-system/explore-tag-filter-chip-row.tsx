/**
 * Fila horizontal de chips «Cualquiera» + etiquetas (icono Tag) compartida entre SearchSurface y el mapa (Explorar).
 */

import { ExploreTagIconLabel } from "@/components/design-system/explore-tag-icon-label";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Trash2 } from "lucide-react-native";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

const webTagChipNoSelect =
  Platform.OS === "web"
    ? ({ userSelect: "none", WebkitUserSelect: "none" } as const)
    : null;

export type ExploreTagFilterOption = { id: string; name: string; count: number };

export type ExploreTagFilterChipRowProps = {
  tagFilterOptions: ExploreTagFilterOption[];
  selectedTagFilterId: string | null;
  onTagFilterChange: (tagId: string | null) => void;
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
  selectedTagFilterId,
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
        containerMaxWidth != null ? { maxWidth: containerMaxWidth, alignSelf: "center" } : null,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.scrollWrap}>
        <ScrollView
          key={tagFilterEditMode ? "tag-filter-edit" : "tag-filter-browse"}
          horizontal
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          style={[
            styles.scroll,
            Platform.OS === "web" ? ({ touchAction: "pan-x" } as ViewStyle) : null,
          ]}
          contentContainerStyle={styles.scrollContent}
        >
          {!tagFilterEditMode ? (
            <Pressable
              onPress={() => {
                onTagFilterChange(null);
              }}
              style={[
                styles.chip,
                webTagChipNoSelect,
                {
                  backgroundColor: selectedTagFilterId == null ? colors.tint : colors.background,
                  borderColor: colors.borderSubtle,
                },
              ]}
              accessibilityLabel="Sin filtrar por etiqueta"
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTagFilterId == null }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  webTagChipNoSelect,
                  { color: selectedTagFilterId == null ? colors.background : colors.text },
                ]}
                numberOfLines={1}
              >
                Cualquiera
              </Text>
            </Pressable>
          ) : null}
          {tagFilterOptions.map((opt) => {
            const selected = selectedTagFilterId === opt.id;
            const chipEditSelected = tagFilterEditMode && selected;
            const chipColors: ViewStyle = {
              backgroundColor: chipEditSelected
                ? colors.stateError
                : selected
                  ? colors.tint
                  : colors.background,
              borderColor: chipEditSelected ? colors.stateError : colors.borderSubtle,
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
                style={[styles.chip, styles.chipInner, chipColors, webTagChipNoSelect]}
              >
                <Pressable
                  onPress={() => {
                    if (tagFilterEditMode) return;
                    onTagFilterChange(selected ? null : opt.id);
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
                    textStyle={[styles.chipLabel, webTagChipNoSelect, { color: chipLabelColor }]}
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
                    <Trash2 size={14} color={trashIconColor} strokeWidth={2.5} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
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
          <Text style={[styles.doneBtnLabel, { color: colors.surfaceOnMap }]}>Listo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    maxHeight: 48,
    minHeight: 40,
    width: "100%",
  },
  rowSearch: {
    marginBottom: Spacing.md,
  },
  rowMap: {
    marginBottom: 0,
  },
  scrollWrap: {
    flex: 1,
    minWidth: 0,
    maxHeight: 48,
  },
  scroll: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxHeight: 48,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
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
