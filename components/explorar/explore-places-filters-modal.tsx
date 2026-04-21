/**
 * Filtros de listado Lugares: etiquetas + país (`ExploreTagFilterChipRow` / `ExploreCountryFilterChipRow`).
 * - `presentation="modal"`: `Modal` a pantalla completa (móvil / web sin panel embebido).
 * - `presentation="sidebarPanel"`: mismo contenido embebido en la columna desktop (OL-EXPLORE-FILTERS-MODAL-SIDEBAR-001).
 */

import type {
  ExplorePlacesCountryFilter,
  CountrySheetItem,
} from "@/components/design-system/countries-sheet-types";
import { ExploreCountryFilterChipRow } from "@/components/design-system/explore-country-filter-chip-row";
import { ExploreTagFilterChipRow } from "@/components/design-system/explore-tag-filter-chip-row";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { X } from "lucide-react-native";
import React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Alineado con CTA sheet `ExplorePlacesActiveFiltersBar` (bitácora 364). */
const FILTERS_PANEL_TITLE = "Etiquetas y filtros";

export type ExplorePlacesFiltersModalPresentation = "modal" | "sidebarPanel";

export type ExplorePlacesFiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  countryItems: CountrySheetItem[];
  countryFilter: ExplorePlacesCountryFilter | null;
  onSelectAllPlaces: () => void;
  onToggleCountry: (item: CountrySheetItem) => void;
  tagFilterOptions: { id: string; name: string; count: number }[];
  /** Vacío = sin filtro por etiqueta. Varios = OR. */
  selectedTagFilterIds: readonly string[];
  onTagFilterChange: (tagIds: string[]) => void;
  tagFilterEditMode: boolean;
  onTagFilterEnterEditMode?: () => void;
  onTagFilterExitEditMode?: () => void;
  onRequestDeleteUserTag?: (tagId: string, tagName: string) => void;
  showTagsSection: boolean;
  presentation?: ExplorePlacesFiltersModalPresentation;
};

type PanelContentProps = Omit<
  ExplorePlacesFiltersModalProps,
  "visible" | "presentation"
> & {
  presentation: ExplorePlacesFiltersModalPresentation;
};

function ExplorePlacesFiltersPanelContent({
  onClose,
  countryItems,
  countryFilter,
  onSelectAllPlaces,
  onToggleCountry,
  tagFilterOptions,
  selectedTagFilterIds,
  onTagFilterChange,
  tagFilterEditMode,
  onTagFilterEnterEditMode,
  onTagFilterExitEditMode,
  onRequestDeleteUserTag,
  showTagsSection,
  presentation,
}: PanelContentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const topBarPadV = presentation === "sidebarPanel" ? Spacing.xs : Spacing.sm;

  return (
    <>
      <View
        style={[
          styles.topBar,
          { borderBottomColor: colors.borderSubtle, paddingVertical: topBarPadV },
        ]}
      >
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {FILTERS_PANEL_TITLE}
        </Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <X size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        contentContainerStyle={styles.scrollContent}
      >
        {showTagsSection && tagFilterOptions.length > 0 ? (
          <View style={styles.block}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Etiquetas</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              Se muestran lugares que tengan{" "}
              <Text style={{ fontWeight: "700" }}>cualquiera</Text> de las etiquetas seleccionadas.
            </Text>
            {onRequestDeleteUserTag != null && onTagFilterEnterEditMode != null ? (
              <Text style={[styles.sectionHint, styles.hintTight, { color: colors.textSecondary }]}>
                Mantén pulsada una etiqueta para borrarla.
              </Text>
            ) : null}
            <ExploreTagFilterChipRow
              variant="search"
              tagFilterOptions={tagFilterOptions}
              selectedTagFilterIds={selectedTagFilterIds}
              onTagFilterChange={onTagFilterChange}
              tagFilterEditMode={tagFilterEditMode}
              onTagFilterEnterEditMode={onTagFilterEnterEditMode}
              onTagFilterExitEditMode={onTagFilterExitEditMode}
              onRequestDeleteUserTag={onRequestDeleteUserTag}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.block,
            showTagsSection && tagFilterOptions.length > 0 ? styles.blockSpaced : null,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>País</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            Elige uno o varios países, o deja «Todos» activo. Se combina con las etiquetas que marques arriba.
          </Text>
          <ExploreCountryFilterChipRow
            variant="search"
            countryItems={countryItems}
            countryFilter={countryFilter}
            onSelectAllPlaces={onSelectAllPlaces}
            onToggleCountry={onToggleCountry}
          />
        </View>
      </ScrollView>
    </>
  );
}

export function ExplorePlacesFiltersModal({
  visible,
  onClose,
  countryItems,
  countryFilter,
  onSelectAllPlaces,
  onToggleCountry,
  tagFilterOptions,
  selectedTagFilterIds,
  onTagFilterChange,
  tagFilterEditMode,
  onTagFilterEnterEditMode,
  onTagFilterExitEditMode,
  onRequestDeleteUserTag,
  showTagsSection,
  presentation = "modal",
}: ExplorePlacesFiltersModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const panelProps: PanelContentProps = {
    onClose,
    countryItems,
    countryFilter,
    onSelectAllPlaces,
    onToggleCountry,
    tagFilterOptions,
    selectedTagFilterIds,
    onTagFilterChange,
    tagFilterEditMode,
    onTagFilterEnterEditMode,
    onTagFilterExitEditMode,
    onRequestDeleteUserTag,
    showTagsSection,
    presentation,
  };

  if (presentation === "sidebarPanel") {
    if (!visible) return null;
    return (
      <View
        style={[styles.sidebarPanelRoot, { backgroundColor: colors.backgroundElevated }]}
        accessibilityViewIsModal
      >
        <ExplorePlacesFiltersPanelContent {...panelProps} />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : undefined}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.backgroundElevated }]}
        edges={["top", "bottom", "left", "right"]}
      >
        <ExplorePlacesFiltersPanelContent {...panelProps} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  sidebarPanelRoot: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    alignSelf: "stretch",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  block: {
    alignSelf: "stretch",
  },
  blockSpaced: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  hintTight: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
});
