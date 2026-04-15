/**
 * Vitrina DS: `ExploreTagFilterChipRow` + `ExploreCountryFilterChipRow` con el mismo copy de hints
 * que `explore-places-filters-modal` y la fila de etiquetas en `SearchSurface` (semántica OR).
 */

import { ExploreCountryFilterChipRow } from '@/components/design-system/explore-country-filter-chip-row';
import { ExploreTagFilterChipRow } from '@/components/design-system/explore-tag-filter-chip-row';
import type { CountriesSheetListDetail } from '@/components/design-system/countries-sheet-types';
import { DS_MOCK_COUNTRY_ITEMS } from '@/components/design-system/countries-sheet-list-demo';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TAG_OPTIONS = [
  { id: 'tag-ruta', name: 'ruta', count: 3 },
  { id: 'tag-2026', name: '2026', count: 2 },
];

/**
 * Demo aislada: contrato de chips (sin `SearchSurface` completo).
 * Import vitrina: `@/components/design-system/explore-filter-chips-showcase`.
 */
export function ExploreFilterChipsShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedTagFilterIds, setSelectedTagFilterIds] = useState<string[]>([]);
  const [tagEditMode, setTagEditMode] = useState(false);
  const [countryDetail, setCountryDetail] = useState<CountriesSheetListDetail>({ kind: 'all_places' });

  return (
    <View style={styles.outer}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Varias etiquetas activas = OR (cualquier coincidencia). País: un chip a la vez; tokens
        `explorePlacesCountryChip*` + `surfaceOnMap` al seleccionar.
      </Text>

      <View style={[styles.card, { borderColor: colors.borderSubtle, backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Etiquetas</Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
          Se muestran lugares que tengan <Text style={{ fontWeight: '700' }}>cualquiera</Text> de las
          etiquetas seleccionadas.
        </Text>
        <ExploreTagFilterChipRow
          variant="search"
          tagFilterOptions={TAG_OPTIONS}
          selectedTagFilterIds={selectedTagFilterIds}
          onTagFilterChange={setSelectedTagFilterIds}
          tagFilterEditMode={tagEditMode}
          onTagFilterEnterEditMode={() => setTagEditMode(true)}
          onTagFilterExitEditMode={() => setTagEditMode(false)}
          onRequestDeleteUserTag={() => setTagEditMode(false)}
        />
      </View>

      <View style={[styles.card, { borderColor: colors.borderSubtle, backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>País</Text>
        <ExploreCountryFilterChipRow
          variant="search"
          countryItems={DS_MOCK_COUNTRY_ITEMS}
          countryDetail={countryDetail}
          onSelectAllPlaces={() => setCountryDetail({ kind: 'all_places' })}
          onSelectCountry={(item) =>
            setCountryDetail({ kind: 'country', key: item.key, label: item.label })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  intro: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
});
