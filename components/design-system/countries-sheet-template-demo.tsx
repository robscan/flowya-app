/**
 * Vitrina DS: plantilla del sheet de países — solo compone piezas canónicas (sin duplicar markup):
 * `SpotSheetHeader`, `CountriesSheetKpiRow`, `CountriesMapPreview`, `CountriesSheetVisitedProgress` (visitados),
 * `CountriesSheetCountryList`. Misma pila que `CountriesSheet` (expanded).
 */

import { CountriesMapPreview } from '@/components/design-system/countries-map-preview';
import { CountriesSheetCountryList } from '@/components/design-system/countries-sheet-country-list';
import { CountriesSheetKpiRow } from '@/components/design-system/countries-sheet-kpi-row';
import type { CountrySheetItem } from '@/components/design-system/countries-sheet-types';
import { CountriesSheetVisitedProgress } from '@/components/design-system/countries-sheet-visited-progress';
import { SpotSheetHeader } from '@/components/explorar/spot-sheet/SpotSheetHeader';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WEB_SHEET_MAX_WIDTH } from '@/lib/web-layout';
import { computeTravelerPoints, resolveTravelerLevelByPoints } from '@/lib/traveler-levels';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { DS_MOCK_COUNTRY_ITEMS } from './countries-sheet-list-demo';

const MAP_PREVIEW_HEIGHT = 176;
const MAP_PREVIEW_TOP_GAP = Spacing.md;
const CONTAINER_PADDING_BOTTOM = 16;

type CountriesSheetTemplateDemoProps = {
  filterMode: 'saved' | 'visited';
  items?: CountrySheetItem[];
  summaryCountriesCount?: number;
  summaryPlacesCount?: number;
  worldPercentage?: number;
};

export function CountriesSheetTemplateDemo({
  filterMode,
  items = DS_MOCK_COUNTRY_ITEMS,
  summaryCountriesCount = 12,
  summaryPlacesCount = 48,
  worldPercentage = 18,
}: CountriesSheetTemplateDemoProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  const colors = useMemo(() => {
    const base = Colors[scheme];
    const panelOverrides =
      filterMode === 'saved'
        ? {
            background: base.countriesPanelToVisitBackground,
            backgroundElevated: base.countriesPanelToVisitBackgroundElevated,
            border: base.countriesPanelToVisitBorder,
            borderSubtle: base.countriesPanelToVisitBorderSubtle,
          }
        : {
            background: base.countriesPanelVisitedBackground,
            backgroundElevated: base.countriesPanelVisitedBackgroundElevated,
            border: base.countriesPanelVisitedBorder,
            borderSubtle: base.countriesPanelVisitedBorderSubtle,
          };
    return {
      ...base,
      ...panelOverrides,
    };
  }, [scheme, filterMode]);

  const travelerPoints = computeTravelerPoints(summaryCountriesCount, summaryPlacesCount);
  const pointsLabel = new Intl.NumberFormat('es-MX').format(travelerPoints);
  const currentLevel = resolveTravelerLevelByPoints(travelerPoints);
  const normalizedWorld = Math.max(0, Math.min(100, Math.round(worldPercentage)));

  const previewCodes = items
    .map((item) => item.key.match(/^iso:([A-Z]{2})$/)?.[1] ?? null)
    .filter((c): c is string => c != null);

  const title =
    filterMode === 'saved' ? 'Países por visitar' : 'Países visitados';

  const previewHighlightColor =
    filterMode === 'saved' ? colors.stateToVisit : colors.stateSuccess;
  const previewBaseCountryColor =
    filterMode === 'saved' ? colors.countriesMapCountryBaseToVisit : colors.countriesMapCountryBaseVisited;
  const previewLineCountryColor =
    filterMode === 'saved' ? colors.countriesMapCountryLineToVisit : colors.countriesMapCountryLineVisited;

  const listColors = {
    text: colors.text,
    textSecondary: colors.textSecondary,
    primary: colors.primary,
  };

  return (
    <View
      style={[
        styles.sheetContainer,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          maxWidth: WEB_SHEET_MAX_WIDTH,
        },
      ]}
    >
      <SpotSheetHeader
        isDraft={false}
        isPlacingDraftSpot={false}
        isPoiMode={false}
        poiLoading={false}
        displayTitle={title}
        state="expanded"
        colors={{
          text: colors.text,
          textSecondary: colors.textSecondary,
          borderSubtle: colors.borderSubtle,
        }}
        onHeaderTap={() => {}}
        onShare={() => {}}
        onClose={() => {}}
        onDragAreaLayout={() => {}}
        onHeaderLayout={() => {}}
      />

      <CountriesSheetKpiRow
        filterMode={filterMode}
        summaryCountriesCount={summaryCountriesCount}
        summaryPlacesCount={summaryPlacesCount}
        pointsLabel={pointsLabel}
        colors={{
          text: colors.text,
          textSecondary: colors.textSecondary,
          primary: colors.primary,
          borderSubtle: colors.borderSubtle,
          background: colors.background,
          backgroundElevated: colors.backgroundElevated,
        }}
      />

      <View style={styles.mapPreviewWrap}>
        <CountriesMapPreview
          countryCodes={previewCodes}
          height={MAP_PREVIEW_HEIGHT}
          highlightColor={previewHighlightColor}
          forceColorScheme={scheme}
          baseCountryColor={previewBaseCountryColor}
          lineCountryColor={previewLineCountryColor}
        />
      </View>

      {filterMode === 'visited' ? (
        <CountriesSheetVisitedProgress
          worldPercentage={normalizedWorld}
          levelLabel={currentLevel.label}
          levelIndex={currentLevel.level}
          currentTravelerPoints={travelerPoints}
          colors={{
            text: colors.text,
            textSecondary: colors.textSecondary,
            primary: colors.primary,
            borderSubtle: colors.borderSubtle,
            stateSuccess: colors.stateSuccess,
          }}
          onPressLevels={() => {}}
        />
      ) : null}

      <CountriesSheetCountryList
        items={items}
        onItemPress={() => {}}
        maxHeight={200}
        colors={listColors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    alignSelf: 'stretch',
    width: '100%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Math.max(24, CONTAINER_PADDING_BOTTOM + Spacing.sm),
  },
  mapPreviewWrap: {
    height: MAP_PREVIEW_HEIGHT,
    borderRadius: Radius.lg,
    marginHorizontal: 0,
    marginTop: MAP_PREVIEW_TOP_GAP,
    overflow: 'hidden',
  },
});
