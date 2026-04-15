/**
 * Pantalla completa de filtros de listado de lugares (etiquetas + países en chips).
 * El scroll es único a nivel de pantalla.
 */

import type {
  CountriesSheetListDetail,
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

export type ExplorePlacesFiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  countryItems: CountrySheetItem[];
  countryDetail: CountriesSheetListDetail | null;
  onSelectAllPlaces: () => void;
  onSelectCountry: (item: CountrySheetItem) => void;
  tagFilterOptions: { id: string; name: string; count: number }[];
  /** Vacío = sin filtro por etiqueta. Varios = OR. */
  selectedTagFilterIds: readonly string[];
  onTagFilterChange: (tagIds: string[]) => void;
  tagFilterEditMode: boolean;
  onTagFilterEnterEditMode?: () => void;
  onTagFilterExitEditMode?: () => void;
  onRequestDeleteUserTag?: (tagId: string, tagName: string) => void;
  showTagsSection: boolean;
};

export function ExplorePlacesFiltersModal({
  visible,
  onClose,
  countryItems,
  countryDetail,
  onSelectAllPlaces,
  onSelectCountry,
  tagFilterOptions,
  selectedTagFilterIds,
  onTagFilterChange,
  tagFilterEditMode,
  onTagFilterEnterEditMode,
  onTagFilterExitEditMode,
  onRequestDeleteUserTag,
  showTagsSection,
}: ExplorePlacesFiltersModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
        <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.title, { color: colors.text }]}>Filtros</Text>
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
            <ExploreCountryFilterChipRow
              variant="search"
              countryItems={countryItems}
              countryDetail={countryDetail}
              onSelectAllPlaces={onSelectAllPlaces}
              onSelectCountry={onSelectCountry}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
});
