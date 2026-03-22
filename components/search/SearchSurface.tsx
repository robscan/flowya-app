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
import React, { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Search, Trash2, X } from 'lucide-react-native';
import { SearchInputV2 } from './SearchInputV2';
import { ListView } from './SearchResultsListV2';
import type { SearchFloatingProps } from './types';

const HEADER_PILL_RADIUS = 22;
const HEADER_ROW_HEIGHT = 44;

/** Web: evita selección de texto en long-press (modo edición de chips). */
const webTagChipNoSelect =
  Platform.OS === 'web'
    ? ({ userSelect: 'none', WebkitUserSelect: 'none' } as const)
    : null;

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
  resultsSummaryLabel,
  showResultsOnEmpty = false,
  getItemKey,
  pinFilter,
  pinCounts,
  onPinFilterChange,
  tagFilterOptions = [],
  selectedTagFilterId = null,
  onTagFilterChange,
  tagFilterEditMode = false,
  onTagFilterEnterEditMode,
  onTagFilterExitEditMode,
  onRequestDeleteUserTag,
  placeSuggestions = [],
  onCreateFromPlace,
  activitySummary,
  onClosePress,
  onScrollDismissKeyboard,
  scrollViewKeyboardDismissMode = 'on-drag',
  onInputFocus,
  onInputBlur,
}: SearchSurfaceProps<T>) {
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const keyFor = (item: T, idx: number) => (getItemKey ? getItemKey(item) : `item-${idx}`);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const searchPlaceholderColor =
    colorScheme === 'dark' ? 'rgba(235,235,245,0.58)' : 'rgba(60,60,67,0.72)';
  const sectionHeaderColor = colorScheme === 'dark' ? '#EEF3FF' : colors.textSecondary;
  const sectionHeaderGlowColor =
    colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)';
  const sectionHeaderGlowStyle = { textShadow: `0px 1px 6px ${sectionHeaderGlowColor}` } as const;

  const q = controller.query.trim();
  const len = q.length;
  const isEmpty = len === 0;
  const isPreSearch = len > 0 && len < 3;
  const isSearch = len >= 3;
  const displayResults = resultsOverride ?? controller.results;
  const showPlaceRecommendations = pinFilter == null || pinFilter === 'all';
  const isFilteredPinSearch = pinFilter === 'saved' || pinFilter === 'visited';
  const searchPlaceholder =
    pinFilter === 'saved'
      ? 'Busca en tus spots por visitar'
      : pinFilter === 'visited'
        ? 'Busca en tus spots visitados'
        : 'Busca: países, regiones o lugares';
  const hideListTitles = isFilteredPinSearch;
  /** isEmpty: mostrar "Spots en la zona" (ocultar solo cuando saved/visited). */
  const hideDefaultListTitle = hideListTitles;
  const shouldRenderResultsOnEmpty = showResultsOnEmpty && isEmpty && displayResults.length > 0;
  const shouldRenderResultsList = (isSearch || shouldRenderResultsOnEmpty) && displayResults.length > 0;
  const isNoResults = isSearch && displayResults.length === 0 && !controller.isLoading;
  const showGlobalPinExpandHint =
    isFilteredPinSearch && controller.isGlobalPinExpandActive && displayResults.length > 0 && isSearch;

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
      {tagFilterOptions.length > 0 && onTagFilterChange != null ? (
        <View style={styles.tagFilterRow}>
          <View style={styles.tagFilterScrollWrap}>
            <ScrollView
              key={tagFilterEditMode ? 'tag-filter-edit' : 'tag-filter-browse'}
              horizontal
              scrollEnabled
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              style={[
                styles.tagFilterScroll,
                Platform.OS === 'web' ? ({ touchAction: 'pan-x' } as ViewStyle) : null,
              ]}
              contentContainerStyle={styles.tagFilterScrollContent}
            >
            <Pressable
              onPress={() => {
                if (tagFilterEditMode) return;
                onTagFilterChange(null);
              }}
              style={[
                styles.tagFilterChip,
                webTagChipNoSelect,
                {
                  backgroundColor: selectedTagFilterId == null ? colors.tint : colors.background,
                  borderColor: colors.borderSubtle,
                  opacity: tagFilterEditMode ? 0.75 : 1,
                },
              ]}
              accessibilityLabel="Sin filtrar por etiqueta"
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTagFilterId == null }}
            >
              <Text
                style={[
                  styles.tagFilterChipLabel,
                  webTagChipNoSelect,
                  { color: selectedTagFilterId == null ? colors.background : colors.text },
                ]}
                numberOfLines={1}
              >
                Cualquiera
              </Text>
            </Pressable>
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
                  style={[styles.tagFilterChip, styles.tagFilterChipInner, chipColors, webTagChipNoSelect]}
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
                    style={styles.tagFilterChipMainPress}
                    accessibilityLabel={`Filtrar por ${opt.name}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[styles.tagFilterChipLabel, webTagChipNoSelect, { color: chipLabelColor }]}
                      numberOfLines={1}
                    >
                      #{opt.name}
                      {opt.count > 0 ? ` (${opt.count})` : ''}
                    </Text>
                  </Pressable>
                  {tagFilterEditMode && onRequestDeleteUserTag != null ? (
                    <Pressable
                      onPress={() => onRequestDeleteUserTag(opt.id, opt.name)}
                      hitSlop={10}
                      style={styles.tagFilterChipRemove}
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
                styles.tagFilterDoneBtn,
                {
                  backgroundColor: colors.tint,
                  borderColor: colors.tint,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              accessibilityLabel="Salir del modo edición de etiquetas"
              accessibilityRole="button"
            >
              <Text style={[styles.tagFilterDoneBtnLabel, { color: colors.surfaceOnMap }]}>Listo</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchPill,
            {
              backgroundColor: colors.background,
              borderColor: searchInputFocused ? colors.tint : colors.border,
              borderWidth: searchInputFocused ? 2 : 1,
            },
          ]}
          accessibilityRole="search"
        >
          <Search size={20} color={colors.textSecondary} strokeWidth={2} />
          <SearchInputV2
            value={controller.query}
            onChangeText={controller.setQuery}
            onClear={controller.clear}
            placeholder={searchPlaceholder}
            placeholderTextColor={searchPlaceholderColor}
            autoFocus
            embedded
            accessibilityLabel={
              pinFilter === 'saved'
                ? 'Buscar en tus spots por visitar'
                : pinFilter === 'visited'
                  ? 'Buscar en tus spots visitados'
                  : 'Buscar en el mapa'
            }
            onFocus={() => {
              setSearchInputFocused(true);
              onInputFocus?.();
            }}
            onBlur={() => {
              setSearchInputFocused(false);
              onInputBlur?.();
            }}
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
        {!shouldRenderResultsOnEmpty &&
        isEmpty &&
        (defaultItemSections.some((s) => s.items.length > 0) || defaultItems.length > 0) && (
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
        {shouldRenderResultsList && (
          <View style={styles.resultsListWrap}>
            {showGlobalPinExpandHint ? (
              <Text
                style={[styles.globalPinExpandHint, { color: colors.textSecondary }]}
                accessibilityRole="text"
              >
                {pinFilter === 'saved'
                  ? 'No hay coincidencias en Por visitar; mostrando resultados como en Todos (tus spots y lugares sugeridos).'
                  : 'No hay coincidencias en Visitados; mostrando resultados como en Todos (tus spots y lugares sugeridos).'}
              </Text>
            ) : null}
            {resultsSummaryLabel ? (
              <Text style={[styles.sectionHeader, { color: sectionHeaderColor }, sectionHeaderGlowStyle]}>
                {resultsSummaryLabel}
              </Text>
            ) : null}
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
          </View>
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
                      ? 'Ups, no hay spots con ese nombre guardados aquí.'
                      : 'Ups, no encontré ese spot en el mapa.'}
                  </Text>
                ) : null;
              })()}
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
    marginBottom: Spacing.md,
    flexShrink: 0,
  },
  filterRow: {
    flex: 1,
    minWidth: 0,
  },
  tagFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    maxHeight: 48,
    minHeight: 40,
  },
  /** Contenedor flex para que el ScrollView horizontal siga midiendo bien al mostrar/ocultar «Listo». */
  tagFilterScrollWrap: {
    flex: 1,
    minWidth: 0,
    maxHeight: 48,
  },
  tagFilterScroll: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxHeight: 48,
  },
  tagFilterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  tagFilterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 220,
  },
  tagFilterChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 260,
  },
  /** Fila del chip # (no Pressable) para poder poner filtro y X como botones hermanos en web. */
  tagFilterChipMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  tagFilterChipRemove: {
    padding: 2,
    marginLeft: 2,
    flexShrink: 0,
  },
  tagFilterDoneBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexShrink: 0,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        cursor: 'pointer' as const,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  tagFilterDoneBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagFilterChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchRow: {
    marginBottom: Spacing.md,
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
  resultsListWrap: {
    flex: 1,
    minHeight: 0,
    gap: Spacing.sm,
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
  globalPinExpandHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
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
});
