/**
 * SearchSurface — Árbol de contenido unificado de búsqueda (web + native).
 * OL-WOW-F2-001: extrae contenido compartido de SearchOverlayWeb y SearchFloatingNative.
 * Adapters por plataforma (web: overlay + scroll-lock; native: sheet + gesture) envuelven SearchSurface.
 * renderItem genérico compatible con Spot | PlaceResult (OL-WOW-F2-001-SEARCH, F2-001-EMPTY).
 */

import { IconButton } from '@/components/design-system/icon-button';
import { MapPinFilterInline } from '@/components/design-system/map-pin-filter-inline';
import { ResultRow } from '@/components/design-system/search-list-card';
import { ActivitySummary } from '@/components/design-system/activity-summary';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { SearchInputV2 } from './SearchInputV2';
import { ListView } from './SearchResultsListV2';
import type { SearchFloatingProps } from './types';

const HEADER_PILL_RADIUS = 22;
const HEADER_ROW_HEIGHT = 44;

export type SearchSurfaceProps<T> = SearchFloatingProps<T> & {
  /** Callback al cerrar (pasado por adapter). */
  onClosePress: () => void;
  /** Web: blur en scroll para cerrar teclado. Native: undefined (usa keyboardDismissMode). */
  onScrollDismissKeyboard?: (contentOffsetY: number) => void;
  /** Native: 'on-drag' para ScrollView keyboardDismissMode. Web: no se usa en ScrollView directo. */
  scrollViewKeyboardDismissMode?: 'on-drag' | 'none';
  /** Web: onFocus/onBlur del input (para backdrop). */
  onInputFocus?: () => void;
  onInputBlur?: () => void;
};

export function SearchSurface<T>({
  controller,
  defaultItems,
  defaultItemSections = [],
  recentQueries,
  recentViewedItems,
  renderItem,
  resultsOverride,
  resultSections = [],
  getItemKey,
  pinFilter,
  pinCounts,
  onPinFilterChange,
  placeSuggestions = [],
  onCreateFromPlace,
  activitySummary,
  onClosePress,
  onScrollDismissKeyboard,
  scrollViewKeyboardDismissMode = 'on-drag',
  onInputFocus,
  onInputBlur,
}: SearchSurfaceProps<T>) {
  const keyFor = (item: T, idx: number) => (getItemKey ? getItemKey(item) : `item-${idx}`);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const sectionHeaderColor = colorScheme === 'dark' ? '#EEF3FF' : colors.textSecondary;
  const sectionHeaderGlowColor =
    colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)';
  const sectionHeaderGlowStyle =
    Platform.OS === 'web'
      ? ({ textShadow: `0px 1px 6px ${sectionHeaderGlowColor}` } as const)
      : ({
          textShadowColor: sectionHeaderGlowColor,
          textShadowRadius: 6,
          textShadowOffset: { width: 0, height: 1 } as const,
        } as const);

  const q = controller.query.trim();
  const len = q.length;
  const isEmpty = len === 0;
  const isPreSearch = len > 0 && len < 3;
  const isSearch = len >= 3;
  const displayResults = resultsOverride ?? controller.results;
  const showPlaceRecommendations = pinFilter == null || pinFilter === 'all';
  const isFilteredPinSearch = pinFilter === 'saved' || pinFilter === 'visited';
  const hideListTitles = isFilteredPinSearch;
  /** isEmpty: mostrar "Spots en la zona" (ocultar solo cuando saved/visited). */
  const hideDefaultListTitle = hideListTitles;
  const isNoResults = isSearch && displayResults.length === 0 && !controller.isLoading;

  const scrollProps = {
    keyboardShouldPersistTaps: 'handled' as const,
    ...(scrollViewKeyboardDismissMode === 'on-drag' ? { keyboardDismissMode: 'on-drag' as const } : {}),
  };
  const scrollEventProps = onScrollDismissKeyboard
    ? {
        onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
          onScrollDismissKeyboard(e.nativeEvent.contentOffset.y),
        scrollEventThrottle: 100,
      }
    : {};

  return (
    <View style={styles.contentWrap}>
      <View style={styles.topRow}>
        <View style={styles.filterRow}>
          {pinFilter != null && onPinFilterChange != null ? (
            <MapPinFilterInline
              value={pinFilter}
              onChange={onPinFilterChange}
              counts={pinCounts}
            />
          ) : null}
        </View>
        <IconButton
          variant="default"
          selected
          onPress={onClosePress}
          accessibilityLabel="Cerrar búsqueda"
        >
          <X size={24} color={colors.text} strokeWidth={2} />
        </IconButton>
      </View>
      <View style={styles.searchRow}>
        <View style={[styles.searchPill, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
          <Search size={20} color={colors.textSecondary} strokeWidth={2} />
          <SearchInputV2
            value={controller.query}
            onChangeText={controller.setQuery}
            onClear={controller.clear}
            placeholder="Buscar spots"
            autoFocus
            embedded
            onFocus={onInputFocus}
            onBlur={onInputBlur}
          />
        </View>
      </View>
      {activitySummary?.isVisible ? (
        <View style={styles.activitySummaryWrap}>
          <ActivitySummary
            visitedPlacesCount={activitySummary.visitedPlacesCount}
            pendingPlacesCount={activitySummary.pendingPlacesCount}
            visitedCountriesCount={activitySummary.visitedCountriesCount}
            isLoading={activitySummary.isLoading}
            mode="countries-only"
          />
        </View>
      ) : null}
      <View style={styles.resultsArea}>
        {isEmpty && (defaultItemSections.some((s) => s.items.length > 0) || defaultItems.length > 0) && (
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator
            {...scrollProps}
            {...scrollEventProps}
          >
            {defaultItemSections.some((s) => s.items.length > 0) ? (
              defaultItemSections.map((section) =>
                section.items.length > 0 ? (
                  <View key={section.id} style={styles.sectionWithGap}>
                    <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                      {section.title}
                    </Text>
                    {section.items.map((item, idx) => (
                      <View key={keyFor(item, idx)} style={styles.resultItemWrap}>
                        {renderItem(item)}
                      </View>
                    ))}
                  </View>
                ) : null,
              )
            ) : (
              <>
                {!hideDefaultListTitle ? (
                  <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                    Spots en la zona
                  </Text>
                ) : null}
                {defaultItems.map((item, idx) => (
                  <View key={keyFor(item, idx)} style={styles.resultItemWrap}>
                    {renderItem(item)}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
        {isPreSearch && (recentQueries.length > 0 || recentViewedItems.length > 0) && (
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator
            {...scrollProps}
            {...scrollEventProps}
          >
            {recentQueries.length > 0 && (
              <View style={styles.resultItemWrap}>
                <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                  Búsquedas recientes
                </Text>
                {recentQueries.slice(0, 5).map((queryItem) => (
                  <Pressable
                    key={queryItem}
                    style={styles.historyItem}
                    onPress={() => controller.setQuery(queryItem)}
                  >
                    <Text style={{ color: colors.text }}>{queryItem}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {recentViewedItems.length > 0 && (
              <View style={styles.resultItemWrap}>
                <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                  Vistos recientemente
                </Text>
                <View style={styles.recentListWrap}>
                  {recentViewedItems.slice(0, 10).map((item, idx) => (
                    <View key={keyFor(item, idx)}>{renderItem(item)}</View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
        {isSearch && displayResults.length > 0 && (
          <ListView
            sections={resultSections}
            results={displayResults}
            renderItem={renderItem}
            renderSectionHeader={(section) =>
              isFilteredPinSearch ? (
                <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                  {section.title}
                </Text>
              ) : null
            }
            onEndReached={controller.fetchMore}
            hasMore={controller.hasMore}
            isLoading={controller.isLoading}
            keyboardDismissMode={scrollViewKeyboardDismissMode === 'on-drag' ? 'on-drag' : 'none'}
            onScrollDismissKeyboard={onScrollDismissKeyboard}
            footer={
              showPlaceRecommendations && placeSuggestions.length > 0 && onCreateFromPlace ? (
                <View style={styles.suggestionsSection}>
                  <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                    Recomendaciones
                  </Text>
                  <View style={styles.cardsList}>
                    {placeSuggestions.slice(0, 3).map((place) => (
                      <ResultRow
                        key={place.id}
                        title={place.name}
                        subtitle={place.fullName}
                        onPress={() => onCreateFromPlace(place)}
                        accessibilityLabel={`Ver recomendación: ${place.name}${place.fullName ? `, ${place.fullName}` : ''}`}
                      />
                    ))}
                  </View>
                </View>
              ) : null
            }
          />
        )}
        {isNoResults && (
          <View style={styles.noResultsWrap}>
            <ScrollView
              style={styles.noResultsScroll}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator
              {...scrollProps}
              {...scrollEventProps}
            >
              {(() => {
                const showNoSpotsMessage =
                  isFilteredPinSearch || (isNoResults && placeSuggestions.length === 0);
                return showNoSpotsMessage ? (
                  <Text style={[styles.noResultsIntro, { color: colors.text, textAlign: 'center' }]}>
                    {isFilteredPinSearch
                      ? 'No veo resultados en este filtro. Si quieres te ayudo a buscar en todo el mapa.'
                      : 'No encontramos ese lugar en tus spots.'}
                  </Text>
                ) : null;
              })()}
              {isFilteredPinSearch && onPinFilterChange != null ? (
                <View style={styles.filterCtaSection}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.filterCtaButton,
                      {
                        backgroundColor: pressed
                          ? colors.tintPressed ?? colors.tint
                          : colors.tint,
                      },
                    ]}
                    onPress={() => onPinFilterChange('all')}
                    accessibilityRole="button"
                    accessibilityLabel="Ver todo para buscar en todos tus lugares y recomendaciones"
                  >
                    <Text style={styles.filterCtaButtonText}>Buscar en todo el mapa</Text>
                  </Pressable>
                </View>
              ) : null}
              {showPlaceRecommendations && placeSuggestions.length > 0 && onCreateFromPlace ? (
                <View style={styles.suggestionsSection}>
                  <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                    Lugares recomendados
                  </Text>
                  <View style={styles.cardsList}>
                    {placeSuggestions.map((place) => (
                      <ResultRow
                        key={place.id}
                        title={place.name}
                        subtitle={place.fullName}
                        onPress={() => onCreateFromPlace(place)}
                        accessibilityLabel={`Ver recomendación: ${place.name}${place.fullName ? `, ${place.fullName}` : ''}`}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              {!isFilteredPinSearch ? (
                <View style={styles.chooserSection}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.chooserButton,
                      { backgroundColor: pressed ? colors.tintPressed ?? colors.tint : colors.tint },
                    ]}
                    onPress={controller.onCreate}
                    accessibilityLabel="Crear spot aquí. Centro del mapa o tu ubicación."
                    accessibilityRole="button"
                  >
                    <View style={styles.chooserButtonContent}>
                      <Text style={styles.chooserButtonText}>Crear spot aquí</Text>
                      <Text style={styles.chooserButtonSubtitle}>Centro del mapa o tu ubicación</Text>
                    </View>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    minHeight: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexShrink: 0,
  },
  filterRow: {
    flex: 1,
    minWidth: 0,
  },
  searchRow: {
    marginBottom: Spacing.sm,
    flexShrink: 0,
  },
  activitySummaryWrap: {
    marginBottom: Spacing.sm,
    flexShrink: 0,
  },
  searchPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_ROW_HEIGHT,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
    borderRadius: HEADER_PILL_RADIUS,
    borderWidth: 1,
    minWidth: 0,
  },
  resultsArea: {
    flex: 1,
    minHeight: 0,
  },
  noResultsWrap: {
    flex: 1,
    minHeight: 0,
  },
  noResultsScroll: {},
  resultsScroll: { flex: 1, minHeight: 0 },
  resultsContent: { paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.sm },
  sectionWithGap: { width: '100%', gap: Spacing.sm },
  resultItemWrap: { width: '100%' },
  recentListWrap: { gap: Spacing.sm, width: '100%' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  historyItem: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  noResultsIntro: { fontSize: 15, marginBottom: Spacing.md },
  filterCtaSection: { marginTop: Spacing.xs, marginBottom: Spacing.base },
  filterCtaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  filterCtaButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  suggestionsSection: { marginBottom: Spacing.base },
  cardsList: { gap: Spacing.sm },
  chooserSection: { marginTop: Spacing.sm },
  chooserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  chooserButtonContent: { gap: 2, alignItems: 'center' },
  chooserButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  chooserButtonSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
});
