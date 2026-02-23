/**
 * SearchFloatingNative — Sheet de búsqueda con drag-to-dismiss (solo Native).
 * No body overflow ni visualViewport; solo iOS/Android.
 */

import { IconButton } from '@/components/design-system/icon-button';
import { MapPinFilterInline } from '@/components/design-system/map-pin-filter-inline';
import { SheetHandle } from '@/components/design-system/sheet-handle';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight, MapPin, Search, X } from 'lucide-react-native';
import { SearchInputV2 } from './SearchInputV2';
import { SearchResultsListV2 } from './SearchResultsListV2';
import type { SearchFloatingProps } from './types';

const SEARCH_PANEL_PADDING = 16;
const SHEET_BORDER_RADIUS = 24;
const HEADER_PILL_RADIUS = 22;
const HEADER_ROW_HEIGHT = 44;
const HEADER_TOP_PADDING = 16;
const SEARCH_DURATION_MS = 300;
const SEARCH_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const DRAG_CLOSE_THRESHOLD = 0.25;
const VELOCITY_CLOSE = 800;
const SEARCH_DISMISS_MS = 280;
const SEARCH_SNAP_BACK_MS = 220;

export function SearchFloatingNative<T>({
  controller,
  defaultItems,
  recentQueries,
  recentViewedItems,
  renderItem,
  stageLabel,
  emptyMessage = 'No hay spots cercanos. Busca en el mapa o crea uno nuevo.',
  onCreateLabel = 'Crear nuevo spot',
  getItemKey,
  pinFilter,
  pinCounts,
  onPinFilterChange,
  placeSuggestions = [],
  onCreateFromPlace,
}: SearchFloatingProps<T>) {
  const keyFor = (item: T, idx: number) => (getItemKey ? getItemKey(item) : `item-${idx}`);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenHeight = Dimensions.get('window').height;

  const translateYShared = useSharedValue(screenHeight);
  const dragStartY = useSharedValue(0);

  const blurActiveElement = useCallback(() => {
    if (typeof document !== 'undefined') {
      const el = document.activeElement as HTMLElement | null;
      if (el?.blur) el.blur();
    }
  }, []);

  useEffect(() => {
    if (!controller.isOpen) return;
    translateYShared.value = withTiming(0, {
      duration: SEARCH_DURATION_MS,
      easing: SEARCH_EASING,
    });
  }, [controller.isOpen, translateYShared]);

  const doClose = useCallback(() => controller.setOpen(false), [controller]);
  const requestClose = useCallback(() => {
    blurActiveElement();
    translateYShared.value = withTiming(
      screenHeight,
      { duration: SEARCH_DURATION_MS, easing: SEARCH_EASING },
      (finished) => {
        if (finished) runOnJS(doClose)();
      }
    );
  }, [blurActiveElement, doClose, screenHeight, translateYShared]);

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateYShared.value }],
  }));

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      dragStartY.value = translateYShared.value;
      runOnJS(blurActiveElement)();
    })
    .onUpdate((e) => {
      'worklet';
      const next = dragStartY.value + e.translationY;
      translateYShared.value = Math.max(0, Math.min(screenHeight, next));
    })
    .onEnd((e) => {
      'worklet';
      const current = translateYShared.value;
      const shouldClose =
        current > screenHeight * DRAG_CLOSE_THRESHOLD || e.velocityY > VELOCITY_CLOSE;
      if (shouldClose) {
        translateYShared.value = withTiming(
          screenHeight,
          { duration: SEARCH_DISMISS_MS, easing: SEARCH_EASING },
          (finished) => {
            if (finished) runOnJS(doClose)();
          }
        );
      } else {
        translateYShared.value = withTiming(0, {
          duration: SEARCH_SNAP_BACK_MS,
          easing: SEARCH_EASING,
        });
      }
    });

  const q = controller.query.trim();
  const len = q.length;
  const isEmpty = len === 0;
  const isPreSearch = len > 0 && len < 3;
  const isSearch = len >= 3;
  /** Estado "Sin resultados" (contrato SEARCH_NO_RESULTS_CREATE_CHOOSER): query >= threshold, results vacío, no loading. */
  const isNoResults = isSearch && controller.results.length === 0 && !controller.isLoading;

  if (!controller.isOpen) return null;

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.scrim, { pointerEvents: 'none' }]} />
      <View style={[styles.sheetWrapper, { pointerEvents: 'box-none' }]}>
        <View style={styles.sheetRoot}>
          <Animated.View
            style={[
              styles.sheetPanel,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: colors.borderSubtle,
              },
              panelAnimatedStyle,
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View style={styles.dragArea} collapsable={false}>
                <View style={styles.handleRow}>
                  <SheetHandle />
                </View>
                <View style={[styles.topRow, { paddingTop: HEADER_TOP_PADDING }]}>
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
                    onPress={requestClose}
                    accessibilityLabel="Cerrar búsqueda"
                  >
                    <X size={24} color={colors.text} strokeWidth={2} />
                  </IconButton>
                </View>
                <View style={styles.searchRow}>
                  <View
                    style={[
                      styles.searchPill,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Search size={20} color={colors.textSecondary} strokeWidth={2} />
                    <SearchInputV2
                      value={controller.query}
                      onChangeText={controller.setQuery}
                      onClear={controller.clear}
                      placeholder="Buscar en esta zona del mapa…"
                      autoFocus
                      embedded
                    />
                  </View>
                </View>
              </View>
            </GestureDetector>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoid}
            >
              <View style={styles.resultsArea}>
                {isEmpty && defaultItems.length > 0 && (
                  <ScrollView
                    style={styles.resultsScroll}
                    contentContainerStyle={styles.resultsContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator
                  >
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Spots cercanos</Text>
                    {defaultItems.map((item, idx) => (
                      <View key={keyFor(item, idx)} style={styles.resultItemWrap}>
                        {renderItem(item)}
                      </View>
                    ))}
                  </ScrollView>
                )}
                {isPreSearch && (recentQueries.length > 0 || recentViewedItems.length > 0) && (
                  <ScrollView
                    style={styles.resultsScroll}
                    contentContainerStyle={styles.resultsContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator
                  >
                    {recentQueries.length > 0 && (
                      <View style={styles.resultItemWrap}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
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
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
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
                {isSearch && controller.results.length > 0 && (
                  <>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{stageLabel}</Text>
                    <SearchResultsListV2
                      sections={[]}
                      results={controller.results}
                      renderItem={renderItem}
                      onEndReached={controller.fetchMore}
                      hasMore={controller.hasMore}
                      isLoading={controller.isLoading}
                    />
                  </>
                )}
                {isNoResults && (
                  <View style={styles.noResultsWrap}>
                    <ScrollView
                      style={styles.noResultsScroll}
                      contentContainerStyle={styles.resultsContent}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      showsVerticalScrollIndicator
                    >
                      {(() => {
                        const showNoSpotsMessage = placeSuggestions.length === 0;
                        return showNoSpotsMessage ? (
                          <Text style={[styles.noResultsIntro, { color: colors.text, textAlign: 'center' }]}>
                            No hay spots con ese nombre. Puedes crearlo en Flowya:
                          </Text>
                        ) : null;
                      })()}
                      {/** @deprecated Sugerencias ES↔EN sin criterio útil; eliminar cuando mapPoiResults esté estable. Ver GUARDRAILS_DEPRECACION. */}
                      {false && controller.suggestions.length > 0 && (
                        <View style={styles.suggestionsSection}>
                          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                            Sugerencias
                          </Text>
                          {controller.suggestions.map((s) => (
                            <Pressable
                              key={s}
                              style={({ pressed }) => [
                                styles.suggestionRow,
                                { backgroundColor: pressed ? colors.borderSubtle : 'transparent' },
                              ]}
                              onPress={() => controller.onSuggestionTap(s)}
                              accessibilityLabel={`Buscar: ${s}`}
                              accessibilityRole="button"
                            >
                              <Text style={{ color: colors.text, fontSize: 16 }}>{s}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                      {placeSuggestions.length > 0 && onCreateFromPlace ? (
                        <View style={styles.suggestionsSection}>
                          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                            Crear spot en uno de estos lugares
                          </Text>
                          {placeSuggestions.map((place) => (
                            <Pressable
                              key={place.id}
                              style={({ pressed }) => [
                                styles.suggestionRow,
                                styles.placeRow,
                                { backgroundColor: pressed ? colors.borderSubtle : 'transparent' },
                              ]}
                              onPress={() => onCreateFromPlace(place)}
                              accessibilityLabel={`Crear en ${place.name}${place.fullName ? `, ${place.fullName}` : ''}`}
                              accessibilityRole="button"
                            >
                              <MapPin size={18} color={colors.textSecondary} strokeWidth={2} />
                              <View style={styles.placeRowContent}>
                                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>{place.name}</Text>
                                {place.fullName ? (
                                  <Text style={[styles.placeRowSubtitle, { color: colors.textSecondary }]}>{place.fullName}</Text>
                                ) : null}
                              </View>
                              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
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
                    </ScrollView>
                    <Pressable
                      style={styles.tapToCloseMapArea}
                      onPress={requestClose}
                      accessibilityLabel="Cerrar búsqueda. Toca el mapa."
                      accessibilityRole="button"
                    />
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'transparent', opacity: 0, zIndex: 10 },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    zIndex: 15,
  },
  sheetRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  sheetPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SEARCH_PANEL_PADDING,
    paddingBottom: SEARCH_PANEL_PADDING,
  },
  dragArea: { flexShrink: 0 },
  handleRow: { paddingTop: 8, marginBottom: 4 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterRow: { flex: 1, minWidth: 0 },
  searchRow: { marginBottom: Spacing.sm },
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
  keyboardAvoid: { flex: 1, minHeight: 0 },
  resultsArea: { flex: 1, minHeight: 0, marginTop: Spacing.sm },
  noResultsWrap: { flex: 1, minHeight: 0 },
  noResultsScroll: {},
  tapToCloseMapArea: { flex: 1, minHeight: 80 },
  resultsScroll: { flex: 1, minHeight: 0 },
  resultsContent: { paddingBottom: Spacing.sm, gap: Spacing.sm },
  resultItemWrap: { width: '100%' },
  recentListWrap: { gap: Spacing.sm, width: '100%' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  historyItem: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  noResultsIntro: { fontSize: 15, marginBottom: Spacing.md },
  suggestionsSection: { marginBottom: Spacing.base },
  suggestionRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.sm,
  },
  chooserSection: { marginTop: Spacing.sm },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  placeRowContent: { flex: 1, minWidth: 0, gap: 2 },
  placeRowSubtitle: { fontSize: 13 },
  chooserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chooserRowContent: { gap: 2, flex: 1, minWidth: 0 },
  chooserRowTitle: { fontSize: 16, fontWeight: '600' },
  chooserRowSubtitle: { fontSize: 13 },
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
  emptyText: { fontSize: 15, textAlign: 'center' },
});
