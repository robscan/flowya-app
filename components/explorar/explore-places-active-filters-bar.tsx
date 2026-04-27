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
import { Radius, Spacing, WebNoTextSelect } from "@/constants/theme";
import { getMakiLucideIcon } from "@/lib/maki-icon-mapping";
import { Globe, SlidersHorizontal } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  activeMakiCategories?: { id: string; label: string }[];
  showTagChips: boolean;
  onClearCountryScope: () => void;
  /** Quitar una etiqueta del filtro OR. */
  onClearTagFilter: (tagId: string) => void;
  onClearMakiFilter?: (makiId: string) => void;
  /**
   * En vistas donde el país ya es el título del sheet, el chip país duplica contexto y roba área
   * de lista. Las etiquetas activas se mantienen visibles.
   */
  hideCountryChip?: boolean;
};

/**
 * Solo chips activos (etiquetas → país en la fila). Misma píldora que la banda superior del mapa.
 */
export function ExplorePlacesActiveFilterChips({
  colors,
  countryFilter,
  activeTags,
  activeMakiCategories = [],
  showTagChips,
  onClearCountryScope,
  onClearTagFilter,
  onClearMakiFilter,
  hideCountryChip = false,
}: ExplorePlacesActiveFilterChipsProps) {
  const countrySummaryLabel = getExplorePlacesCountryFilterSummaryLabel(countryFilter);
  const showCountryChip = !hideCountryChip && countrySummaryLabel != null;
  const showTagRow = showTagChips && activeTags.length > 0;
  const showMakiRow = activeMakiCategories.length > 0 && onClearMakiFilter != null;
  if (!showTagRow && !showMakiRow && !showCountryChip) return null;

  const countryBlock =
    showCountryChip && countrySummaryLabel != null ? (
      <View
        style={[
          styles.activeChip,
          WebNoTextSelect,
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
            WebNoTextSelect,
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

  const makiBlocks = showMakiRow
    ? activeMakiCategories.map((maki) => {
        const Icon = getMakiLucideIcon(maki.id);
        return (
          <View
            key={maki.id}
            style={[
              styles.activeChip,
              WebNoTextSelect,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.countryChipBackground,
              },
            ]}
          >
            <Icon
              size={13}
              color={colors.surfaceOnMap}
              strokeWidth={2.1}
              {...(Platform.OS !== "web" ? { accessibilityElementsHidden: true as const } : {})}
            />
            <Text
              style={[styles.activeChipTagText, { color: colors.surfaceOnMap }]}
              numberOfLines={1}
            >
              {maki.label}
            </Text>
            <Pressable
              onPress={() => onClearMakiFilter?.(maki.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Quitar filtro de categoría ${maki.label}`}
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
        );
      })
    : null;

  return (
    <>
      {tagBlocks}
      {makiBlocks}
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

export type ExplorePlacesFiltersButtonProps = {
  colors: ExplorePlacesActiveFiltersBarColors;
  onPress: () => void;
  variant?: "default" | "compact" | "header";
};

export function ExplorePlacesFiltersButton({
  colors,
  onPress,
  variant = "default",
}: ExplorePlacesFiltersButtonProps) {
  const isCompact = variant === "compact" || variant === "header";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        isCompact ? styles.filtersEntryCompact : styles.filtersEntryPrimary,
        variant === "header" ? styles.filtersEntryHeader : null,
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
      <Text
        style={[
          isCompact ? styles.filtersEntryCompactLabel : styles.filtersEntryLabel,
          { color: colors.surfaceOnMap },
        ]}
        numberOfLines={1}
      >
        {FILTERS_ENTRY_LABEL}
      </Text>
    </Pressable>
  );
}

export type ExplorePlacesActiveFiltersBarProps = {
  colors: ExplorePlacesActiveFiltersBarColors;
  countryFilter: ExplorePlacesCountryFilter | null;
  onOpenFiltersPanel: () => void;
  onClearCountryScope: () => void;
  activeTags: { id: string; label: string }[];
  activeMakiCategories?: { id: string; label: string }[];
  onClearTagFilter: (tagId: string) => void;
  onClearMakiFilter?: (makiId: string) => void;
  showTagChips: boolean;
  /** Misma fila que el launcher de búsqueda (sheet Lugares); el host oculta el buscador duplicado arriba. */
  filtersSearchInline?: ExplorePlacesFiltersSearchInline;
  /**
   * Misma fila que `filtersSearchInline`, pero el slot izquierdo lo provee el host (p. ej. `SearchSurface`
   * con `SearchInputV2` embebido). No combinar con `filtersSearchInline`.
   */
  filtersEntryLeading?: React.ReactNode;
  /**
   * `compact` es para el modo Lugares de país: no compite con el buscador full-screen y conserva
   * alto útil para la lista/mapa.
   */
  density?: "default" | "compact";
  hideCountryChip?: boolean;
  /** Cuando el CTA vive en la cabecera del sheet, esta barra renderiza solo chips activos. */
  hideFiltersEntry?: boolean;
};

export function ExplorePlacesActiveFiltersBar({
  colors,
  countryFilter,
  onOpenFiltersPanel,
  onClearCountryScope,
  activeTags,
  activeMakiCategories = [],
  onClearTagFilter,
  onClearMakiFilter,
  showTagChips,
  filtersSearchInline,
  filtersEntryLeading,
  density = "default",
  hideCountryChip = false,
  hideFiltersEntry = false,
}: ExplorePlacesActiveFiltersBarProps) {
  const countryChipVisible =
    !hideCountryChip && isExplorePlacesCountryFilterActive(countryFilter);
  const hasActiveChips =
    (showTagChips && activeTags.length > 0) ||
    activeMakiCategories.length > 0 ||
    countryChipVisible;

  const filtersCtaPrimary = (
    <ExplorePlacesFiltersButton colors={colors} onPress={onOpenFiltersPanel} />
  );

  const filtersCtaCompact = (
    <ExplorePlacesFiltersButton
      colors={colors}
      onPress={onOpenFiltersPanel}
      variant="compact"
    />
  );

  if (hideFiltersEntry) {
    if (!hasActiveChips) return null;
    return (
      <View style={[styles.column, styles.columnCompact]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.compactChipsScrollContent}
          style={styles.chipsOnlyScroll}
        >
          <ExplorePlacesActiveFilterChips
            colors={colors}
            countryFilter={countryFilter}
            activeTags={activeTags}
            activeMakiCategories={activeMakiCategories}
            showTagChips={showTagChips}
            onClearCountryScope={onClearCountryScope}
            onClearTagFilter={onClearTagFilter}
            onClearMakiFilter={onClearMakiFilter}
            hideCountryChip={hideCountryChip}
          />
        </ScrollView>
      </View>
    );
  }

  if (density === "compact" && filtersEntryLeading == null && filtersSearchInline == null) {
    return (
      <View style={[styles.column, styles.columnCompact]}>
        <View style={[styles.compactRow, WebNoTextSelect]}>
          {filtersCtaCompact}
          {hasActiveChips ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.compactChipsScrollContent}
              style={styles.compactChipsScroll}
            >
              <ExplorePlacesActiveFilterChips
                colors={colors}
                countryFilter={countryFilter}
                activeTags={activeTags}
                activeMakiCategories={activeMakiCategories}
                showTagChips={showTagChips}
                onClearCountryScope={onClearCountryScope}
                onClearTagFilter={onClearTagFilter}
                onClearMakiFilter={onClearMakiFilter}
                hideCountryChip={hideCountryChip}
              />
            </ScrollView>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      {filtersEntryLeading != null ? (
        <View style={[styles.entrySearchRow, WebNoTextSelect]}>
          <View style={styles.inlineSearchWrap}>{filtersEntryLeading}</View>
          {filtersCtaPrimary}
        </View>
      ) : filtersSearchInline != null ? (
        <View style={[styles.entrySearchRow, WebNoTextSelect]}>
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
            WebNoTextSelect,
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
            activeMakiCategories={activeMakiCategories}
            showTagChips={showTagChips}
            onClearCountryScope={onClearCountryScope}
            onClearTagFilter={onClearTagFilter}
            onClearMakiFilter={onClearMakiFilter}
            hideCountryChip={hideCountryChip}
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
  columnCompact: {
    marginTop: 0,
    marginBottom: Spacing.xs,
    gap: 0,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: Spacing.sm,
    minHeight: 40,
  },
  compactChipsScroll: {
    flex: 1,
    flexGrow: 1,
    minWidth: 0,
    maxWidth: "100%",
  },
  chipsOnlyScroll: {
    flexGrow: 0,
    maxWidth: "100%",
  },
  compactChipsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 2,
    paddingRight: Spacing.xs,
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
  filtersEntryCompact: {
    flexShrink: 0,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  filtersEntryHeader: {
    alignSelf: "flex-end",
    minHeight: 38,
    paddingHorizontal: Spacing.sm,
  },
  filtersEntryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  filtersEntryCompactLabel: {
    fontSize: 13,
    fontWeight: "700",
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
