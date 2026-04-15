/**
 * Barra: chips activos (fila superior) + botón «Filtros y etiquetas» debajo, bajo el buscador del sheet.
 * El panel completo de edición vive en `ExplorePlacesFiltersModal`.
 *
 * Contraste (referencia WCAG 2.1 AA, texto UI):
 * - Chip país: `surfaceOnMap` sobre `explorePlacesCountryChipBackground` (café/tierra; distinto de etiqueta).
 * - Chip etiqueta: `surfaceOnMap` sobre `tint` (primario).
 * Tipografía chip: 13px / 18 lineHeight, `maxFontSizeMultiplier` acotado en país.
 */

import { ClearIconCircleDecoration } from "@/components/design-system/clear-icon-circle";
import { ExploreTagIconLabel } from "@/components/design-system/explore-tag-icon-label";
import type { CountriesSheetListDetail } from "@/components/design-system/countries-sheet-types";
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
  /** Entrada «Filtros y etiquetas» (borde sutil). */
  background: string;
  /** Texto/icono sobre chips de acento (mismo contraste que en mapa). */
  surfaceOnMap: string;
  countryChipBackground: string;
  countryChipBorder: string;
  tagChipBackground: string;
};

export type ExplorePlacesActiveFilterChipsProps = {
  colors: ExplorePlacesActiveFiltersBarColors;
  countryDetail: CountriesSheetListDetail | null;
  /** Etiquetas en OR; el chip país va primero en la fila para no quedar fuera del scroll horizontal. */
  activeTags: { id: string; label: string }[];
  showTagChips: boolean;
  onClearCountryScope: () => void;
  /** Quitar una etiqueta del filtro OR. */
  onClearTagFilter: (tagId: string) => void;
};

/**
 * Solo chips activos (país → etiquetas en la fila, para scroll). Misma píldora que la banda superior del mapa.
 */
export function ExplorePlacesActiveFilterChips({
  colors,
  countryDetail,
  activeTags,
  showTagChips,
  onClearCountryScope,
  onClearTagFilter,
}: ExplorePlacesActiveFilterChipsProps) {
  const showCountryChip = countryDetail?.kind === "country";
  const showTagRow = showTagChips && activeTags.length > 0;
  if (!showTagRow && !showCountryChip) return null;

  const countryBlock =
    showCountryChip && countryDetail?.kind === "country" ? (
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
          accessibilityLabel={`Ubicación, ${countryDetail.label}`}
          style={[styles.activeChipValue, styles.activeChipCountryLabel, { color: colors.surfaceOnMap }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.35}
        >
          {countryDetail.label}
        </Text>
        <Pressable
          onPress={onClearCountryScope}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Quitar filtro de ubicación, ${countryDetail.label}`}
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
      {countryBlock}
      {tagBlocks}
    </>
  );
}

export type ExplorePlacesActiveFiltersBarProps = {
  colors: ExplorePlacesActiveFiltersBarColors;
  countryDetail: CountriesSheetListDetail | null;
  onOpenFiltersPanel: () => void;
  onClearCountryScope: () => void;
  activeTags: { id: string; label: string }[];
  onClearTagFilter: (tagId: string) => void;
  showTagChips: boolean;
};

export function ExplorePlacesActiveFiltersBar({
  colors,
  countryDetail,
  onOpenFiltersPanel,
  onClearCountryScope,
  activeTags,
  onClearTagFilter,
  showTagChips,
}: ExplorePlacesActiveFiltersBarProps) {
  const hasActiveChips =
    (showTagChips && activeTags.length > 0) ||
    (countryDetail != null && countryDetail.kind === "country");

  return (
    <View style={styles.column}>
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
            countryDetail={countryDetail}
            activeTags={activeTags}
            showTagChips={showTagChips}
            onClearCountryScope={onClearCountryScope}
            onClearTagFilter={onClearTagFilter}
          />
        </ScrollView>
      ) : null}

      <Pressable
        onPress={onOpenFiltersPanel}
        style={({ pressed }) => [
          styles.filtersEntry,
          webNoSelect,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.background,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros y etiquetas de lugares"
      >
        <SlidersHorizontal size={16} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={[styles.filtersEntryLabel, { color: colors.text }]}>Filtros y etiquetas</Text>
      </Pressable>
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
  filtersEntry: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
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
