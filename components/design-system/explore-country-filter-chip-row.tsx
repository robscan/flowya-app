/**
 * Chips «Todos» + países (Globe); multilínea responsiva como `ExploreTagFilterChipRow`.
 * Selección: mismos tokens que chip país en barra activa (`explorePlacesCountryChip*` + `surfaceOnMap`).
 * Nombre y conteo visibles siempre en cada chip.
 */

import { Colors, Radius, Spacing, WebNoTextSelect } from "@/constants/theme";
import type {
  ExplorePlacesCountryFilter,
  CountrySheetItem,
} from "@/components/design-system/countries-sheet-types";
import { normalizeExplorePlacesCountryFilter } from "@/components/design-system/countries-sheet-types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Globe } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export type ExploreCountryFilterChipRowProps = {
  countryItems: CountrySheetItem[];
  countryFilter: ExplorePlacesCountryFilter | null;
  onSelectAllPlaces: () => void;
  onToggleCountry: (item: CountrySheetItem) => void;
  /** `search`: margen bajo (modal filtros). */
  variant?: "search" | "map";
};

export function ExploreCountryFilterChipRow({
  countryItems,
  countryFilter,
  onSelectAllPlaces,
  onToggleCountry,
  variant = "search",
}: ExploreCountryFilterChipRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const totalPlaces = useMemo(
    () => countryItems.reduce((sum, item) => sum + item.count, 0),
    [countryItems],
  );

  const normalizedFilter = useMemo(
    () => normalizeExplorePlacesCountryFilter(countryFilter, countryItems),
    [countryFilter, countryItems],
  );

  const allSelected = normalizedFilter.kind === "all_places";

  return (
    <View
      style={[styles.row, variant === "search" ? styles.rowSearch : styles.rowMap]}
      pointerEvents="box-none"
    >
      <View style={styles.chipWrap}>
        <Pressable
          onPress={onSelectAllPlaces}
          style={[
            styles.chip,
            WebNoTextSelect,
            {
              backgroundColor: allSelected
                ? colors.explorePlacesCountryChipBackground
                : colors.background,
              borderColor: allSelected
                ? colors.explorePlacesCountryChipBorder
                : colors.borderSubtle,
            },
          ]}
          accessibilityLabel={`Todos los países, ${totalPlaces} lugares`}
          accessibilityRole="button"
          accessibilityState={{ selected: allSelected }}
        >
          <Text
            style={[
              styles.chipLabel,
              { color: allSelected ? colors.surfaceOnMap : colors.text },
            ]}
            numberOfLines={1}
          >
            {`Todos (${totalPlaces})`}
          </Text>
        </Pressable>

        {countryItems.map((item) => {
          const selected =
            normalizedFilter.kind === "country_subset" &&
            normalizedFilter.countries.some((country) => country.key === item.key);
          return (
            <Pressable
              key={item.key}
              onPress={() => onToggleCountry(item)}
              style={[
                styles.chip,
                styles.chipInner,
                WebNoTextSelect,
                {
                  backgroundColor: selected
                    ? colors.explorePlacesCountryChipBackground
                    : colors.background,
                  borderColor: selected
                    ? colors.explorePlacesCountryChipBorder
                    : colors.borderSubtle,
                },
              ]}
              accessibilityLabel={`${item.label}, ${item.count} lugares`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Globe
                size={12}
                color={selected ? colors.surfaceOnMap : colors.textSecondary}
                strokeWidth={2.2}
                {...(Platform.OS !== "web" ? { accessibilityElementsHidden: true as const } : {})}
              />
              <Text
                style={[
                  styles.chipLabel,
                  { color: selected ? colors.surfaceOnMap : colors.text },
                ]}
                numberOfLines={1}
              >
                {item.label}
                {` (${item.count})`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
  },
  rowSearch: {
    marginBottom: Spacing.md,
  },
  rowMap: {
    marginBottom: 0,
  },
  /** Saltos de línea según ancho (modal / sidebar / ventana). */
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    alignContent: "flex-start",
    gap: Spacing.sm,
    width: "100%",
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 260,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 280,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
    minWidth: 0,
  },
});
