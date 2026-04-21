/**
 * Barra Lugares (sheet / host): **buscador** (si `filtersSearchInline`) → **CTA** «Etiquetas y filtros» → **chips**
 * activos debajo (OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001). Orden de chips: **etiquetas primero, país después**
 * (OL-EXPLORE-FILTERS-CHIPS-COUNTERS-001). Sin inline (p. ej. overlay Search): CTA primero, chips debajo.
 * El panel completo de edición vive en `ExplorePlacesFiltersModal`.
 *
 * Contraste (referencia WCAG 2.1 AA, texto UI):
 * - Chip país: `surfaceOnMap` sobre `explorePlacesCountryChipBackground` (café/tierra; distinto de etiqueta).
 * - Chip etiqueta: `surfaceOnMap` sobre `tint` (primario).
 * Tipografía chip: 13px / 18 lineHeight, `maxFontSizeMultiplier` acotado en país.
 */

import { ClearIconCircleDecoration } from "@/components/design-system/clear-icon-circle";
import { ExploreTagIconLabel } from "@/components/design-system/explore-tag-icon-label";
import { SearchLauncherField } from "@/components/design-system/search-launcher-field";
import {
  getExplorePlacesCountryFilterSummaryLabel,
  isExplorePlacesCountryFilterActive,
  type ExplorePlacesCountryFilter,
} from "@/components/design-system/countries-sheet-types";
import { Radius, Spacing } from "@/constants/theme";
import { Globe, SlidersHorizontal } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const webNoSelect =
  Platform.OS === "web" ? ({ userSelect: "none", WebkitUserSelect: "none" } as const) : null;

export type ExplorePlacesActiveFiltersBarColors = {
  text: string;
  textSecondary: string;
  borderSubtle: string;
  /** Superficie secundaria (launcher buscador en fila compuesta). */
  background: string;
  /** Texto/icono sobre chips de acento (mismo contraste que en mapa). */
  surfaceOnMap: string;
  countryChipBackground: string;
  countryChipBorder: string;
  tagChipBackground: string;
};

export type ExplorePlacesActiveFilterChipsProps = {
  colors: ExplorePlacesActiveFiltersBarColors;
  countryFilter: ExplorePlacesCountryFilter | null;
  /** Etiquetas en OR; el chip país va después de las etiquetas (scroll horizontal). */
  activeTags: { id: string; label: string }[];
  showTagChips: boolean;
  onClearCountryScope: () => void;
  /** Quitar una etiqueta del filtro OR. */
  onClearTagFilter: (tagId: string) => void;
};

/**
 * Solo chips activos (etiquetas → país en la fila). Misma píldora que la banda superior del mapa.
 */
export function ExplorePlacesActiveFilterChips({
  colors,
  countryFilter,
  activeTags,
  showTagChips,
  onClearCountryScope,
  onClearTagFilter,
}: ExplorePlacesActiveFilterChipsProps) {
  const countrySummaryLabel = getExplorePlacesCountryFilterSummaryLabel(countryFilter);
  const showCountryChip = countrySummaryLabel != null;
  const showTagRow = showTagChips && activeTags.length > 0;
  if (!showTagRow && !showCountryChip) return null;

  const countryBlock =
    showCountryChip && countrySummaryLabel != null ? (
      <View
        style={[
          styles.activeChip,
          webNoSelect,
          {
            borderColor: colors.countryChipBorder,
            backgroundColor: colors.countryChipBackground,
          },
        ]}
      >
        <Globe
          size={13}
          color={colors.surfaceOnMap}
          strokeWidth={2.2}
          {...(Platform.OS !== "web" ? { accessibilityElementsHidden: true as const } : {})}
        />
        <Text
          accessible
          accessibilityLabel={`Ubicación, ${countrySummaryLabel}`}
          style={[styles.activeChipValue, styles.activeChipCountryLabel, { color: colors.surfaceOnMap }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.35}
        >
          {countrySummaryLabel}
        </Text>
        <Pressable
          onPress={onClearCountryScope}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Quitar filtro de ubicación, ${countrySummaryLabel}`}
          style={styles.chipClearDecorHit}
        >
          <ClearIconCircleDecoration
            variant="onPrimary"
            size={22}
            iconPx={11}
            iconColor={colors.surfaceOnMap}
          />
        </Pressable>
      </View>
    ) : null;

  const tagBlocks = showTagRow
    ? activeTags.map((t) => (
        <View
          key={t.id}
          style={[
            styles.activeChip,
            webNoSelect,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.tagChipBackground,
            },
          ]}
        >
          <ExploreTagIconLabel
            name={t.label}
            color={colors.surfaceOnMap}
            iconSize={13}
            textStyle={[styles.activeChipTagText, { color: colors.surfaceOnMap }]}
          />
          <Pressable
            onPress={() => onClearTagFilter(t.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Quitar filtro de etiqueta ${t.label}`}
            style={styles.chipClearDecorHit}
          >
            <ClearIconCircleDecoration
              variant="onPrimary"
              size={22}
              iconPx={11}
              iconColor={colors.surfaceOnMap}
            />
          </Pressable>
        </View>
      ))
    : null;

  return (
    <>
      {tagBlocks}
      {countryBlock}
    </>
  );
}

const FILTERS_ENTRY_LABEL = "Filtrar";

export type ExplorePlacesFiltersSearchInline = {
  onPress: () => void;
  placeholder: string;
  accessibilityLabel?: string;
};

export type ExplorePlacesActiveFiltersBarProps = {
  colors: ExplorePlacesActiveFiltersBarColors;
  countryFilter: ExplorePlacesCountryFilter | null;
  onOpenFiltersPanel: () => void;
  onClearCountryScope: () => void;
  activeTags: { id: string; label: string }[];
  onClearTagFilter: (tagId: string) => void;
  showTagChips: boolean;
  /** Misma fila que el launcher de búsqueda (sheet Lugares); el host oculta el buscador duplicado arriba. */
  filtersSearchInline?: ExplorePlacesFiltersSearchInline;
  /**
   * Misma fila que `filtersSearchInline`, pero el slot izquierdo lo provee el host (p. ej. `SearchSurface`
   * con `SearchInputV2` embebido). No combinar con `filtersSearchInline`.
   */
  filtersEntryLeading?: React.ReactNode;
};

export function ExplorePlacesActiveFiltersBar({
  colors,
  countryFilter,
  onOpenFiltersPanel,
  onClearCountryScope,
  activeTags,
  onClearTagFilter,
  showTagChips,
  filtersSearchInline,
  filtersEntryLeading,
}: ExplorePlacesActiveFiltersBarProps) {
  const hasActiveChips =
    (showTagChips && activeTags.length > 0) || isExplorePlacesCountryFilterActive(countryFilter);

  const filtersCtaPrimary = (
    <Pressable
      onPress={onOpenFiltersPanel}
      style={({ pressed }) => [
        styles.filtersEntryPrimary,
        {
          backgroundColor: colors.tagChipBackground,
          borderColor: colors.tagChipBackground,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Abrir etiquetas y filtros de lugares"
    >
      <SlidersHorizontal size={16} color={colors.surfaceOnMap} strokeWidth={2.2} />
      <Text style={[styles.filtersEntryLabel, { color: colors.surfaceOnMap }]} numberOfLines={1}>
        {FILTERS_ENTRY_LABEL}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.column}>
      {filtersEntryLeading != null ? (
        <View style={[styles.entrySearchRow, webNoSelect]}>
          <View style={styles.inlineSearchWrap}>{filtersEntryLeading}</View>
          {filtersCtaPrimary}
        </View>
      ) : filtersSearchInline != null ? (
        <View style={[styles.entrySearchRow, webNoSelect]}>
          <View style={styles.inlineSearchWrap}>
            <SearchLauncherField
              variant="sheet"
              onPress={filtersSearchInline.onPress}
              placeholder={filtersSearchInline.placeholder}
              accessibilityLabel={filtersSearchInline.accessibilityLabel}
            />
          </View>
          {filtersCtaPrimary}
        </View>
      ) : (
        <Pressable
          onPress={onOpenFiltersPanel}
          style={({ pressed }) => [
            styles.filtersEntryPrimarySolo,
            webNoSelect,
            {
              backgroundColor: colors.tagChipBackground,
              borderColor: colors.tagChipBackground,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Abrir etiquetas y filtros de lugares"
        >
          <SlidersHorizontal size={16} color={colors.surfaceOnMap} strokeWidth={2.2} />
          <Text style={[styles.filtersEntryLabel, { color: colors.surfaceOnMap }]}>{FILTERS_ENTRY_LABEL}</Text>
        </Pressable>
      )}

      {hasActiveChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chipsScrollContent}
          style={styles.chipsScroll}
        >
          <ExplorePlacesActiveFilterChips
            colors={colors}
            countryFilter={countryFilter}
            activeTags={activeTags}
            showTagChips={showTagChips}
            onClearCountryScope={onClearCountryScope}
            onClearTagFilter={onClearTagFilter}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignSelf: "stretch",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  chipsScroll: {
    flexGrow: 0,
    maxWidth: "100%",
  },
  chipsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 2,
    paddingRight: Spacing.xs,
  },
  entrySearchRow: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "stretch",
    gap: Spacing.sm,
    minWidth: 0,
  },
  inlineSearchWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  filtersEntryPrimary: {
    flexShrink: 0,
    maxWidth: "48%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.searchSurfacePill,
    borderWidth: 1,
  },
  filtersEntryPrimarySolo: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  filtersEntryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 5,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 4,
    minHeight: 30,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 280,
    ...Platform.select({
      web: { boxShadow: "0 1px 2px rgba(0,0,0,0.06)" },
      default: { elevation: 2 },
    }),
  },
  chipClearDecorHit: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeChipValue: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  activeChipCountryLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
  },
  activeChipTagText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
    lineHeight: 18,
  },
});
