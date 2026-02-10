/**
 * SearchFloating — Sheet de búsqueda (Explore vNext).
 * Patrón canónico: root fijo bottom + panel con translateY (MOTION_SHEET).
 * Entry/exit animado; drag en handle/header (collapsed ↔ expanded); sin viewport drag.
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ButtonPrimary } from '@/components/design-system/buttons';
import { SheetHandle } from '@/components/design-system/sheet-handle';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';
import { SearchInputV2 } from './SearchInputV2';
import { SearchResultsListV2 } from './SearchResultsListV2';
import type { SearchFloatingProps } from './types';

const SEARCH_PANEL_PADDING = 16;
const SHEET_BORDER_RADIUS = 24;
const HEADER_PILL_RADIUS = 22;
const HEADER_ROW_HEIGHT = 44;
const HEADER_TOP_PADDING = 16;
const SEARCH_COLLAPSED_ANCHOR = 120;
const SEARCH_EXPANDED_RATIO = 0.85;
const SEARCH_DURATION_MS = 300;
const SEARCH_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const VELOCITY_SNAP = 400;
const SNAP_THRESHOLD = 0.25;

export function SearchFloating<T>({
  controller,
  defaultItems,
  recentQueries,
  recentViewedItems,
  renderItem,
  stageLabel,
  emptyMessage = 'No hay spots cercanos. Mantén pulsado el mapa para crear uno.',
  onCreateLabel = 'Crear nuevo spot',
  scope: _scope,
  getItemKey,
  insets: insetsProp,
}: SearchFloatingProps<T>) {
  const keyFor = (item: T, idx: number) => (getItemKey ? getItemKey(item) : `item-${idx}`);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const vh = Dimensions.get('window').height;
  const expandedAnchor = Math.round(vh * SEARCH_EXPANDED_RATIO);
  const collapsedAnchor = SEARCH_COLLAPSED_ANCHOR;
  const maxTranslateY = expandedAnchor - collapsedAnchor;

  const translateYShared = useSharedValue(expandedAnchor);
  const dragStartY = useSharedValue(0);
  const expandedAnchorSV = useSharedValue(expandedAnchor);
  const collapsedAnchorSV = useSharedValue(collapsedAnchor);

  useEffect(() => {
    expandedAnchorSV.value = expandedAnchor;
    collapsedAnchorSV.value = collapsedAnchor;
  }, [expandedAnchor, collapsedAnchor, expandedAnchorSV, collapsedAnchorSV]);

  useEffect(() => {
    if (!controller.isOpen) return;
    translateYShared.value = withTiming(0, {
      duration: SEARCH_DURATION_MS,
      easing: SEARCH_EASING,
    });
  }, [controller.isOpen, translateYShared]);

  const doClose = useCallback(() => controller.setOpen(false), [controller]);
  const requestClose = useCallback(() => {
    translateYShared.value = withTiming(
      expandedAnchor,
      { duration: SEARCH_DURATION_MS, easing: SEARCH_EASING },
      (finished) => {
        if (finished) runOnJS(doClose)();
      }
    );
  }, [doClose, expandedAnchor, translateYShared]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      dragStartY.value = translateYShared.value;
    })
    .onUpdate((e) => {
      'worklet';
      const next = dragStartY.value + e.translationY;
      translateYShared.value = Math.max(0, Math.min(maxTranslateY, next));
    })
    .onEnd((e) => {
      'worklet';
      const exp = expandedAnchorSV.value;
      const col = collapsedAnchorSV.value;
      const currentTy = translateYShared.value;
      const visible = exp - currentTy;
      const velocityY = e.velocityY;
      if (visible < col * 0.5 && velocityY > VELOCITY_SNAP) {
        translateYShared.value = withTiming(
          exp,
          { duration: SEARCH_DURATION_MS, easing: SEARCH_EASING },
          (finished) => {
            if (finished) runOnJS(doClose)();
          }
        );
        return;
      }
      const towardExpanded = visible >= col + (exp - col) * SNAP_THRESHOLD;
      const targetTy = towardExpanded ? 0 : exp - col;
      translateYShared.value = withTiming(targetTy, {
        duration: SEARCH_DURATION_MS,
        easing: SEARCH_EASING,
      });
    });

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateYShared.value }],
  }));

  const q = controller.query.trim();
  const len = q.length;
  const isEmpty = len === 0;
  const isPreSearch = len > 0 && len < 3;
  const isSearch = len >= 3;

  if (!controller.isOpen) return null;

  return (
    <>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          {
            backgroundColor:
              colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.72)',
            pointerEvents: 'auto',
          },
        ]}
        onPress={requestClose}
      />
      <View
        style={[
          styles.sheetRoot,
          {
            height: expandedAnchor,
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.sheetPanel,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              height: expandedAnchor,
            },
            panelAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragArea}>
              <View style={styles.handleRow}>
                <SheetHandle />
              </View>
              <View style={[styles.headerRow, { paddingTop: HEADER_TOP_PADDING }]}>
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
                    placeholder="Buscar lugares…"
                    autoFocus
                    embedded
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.closeButton,
                    { backgroundColor: pressed ? colors.borderSubtle : 'transparent' },
                  ]}
                  onPress={requestClose}
                  accessibilityLabel="Cerrar búsqueda"
                  accessibilityRole="button"
                >
                  <X size={24} color={colors.text} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>
          <View style={styles.resultsArea}>
          {isEmpty && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Cercanos</Text>
              {defaultItems.length > 0 ? (
                defaultItems.map((item, idx) => (
                  <View key={keyFor(item, idx)} style={styles.resultItemWrap}>
                    {renderItem(item)}
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyMessage}</Text>
              )}
            </ScrollView>
          )}

          {isPreSearch && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <View style={styles.resultItemWrap}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  Búsquedas recientes
                </Text>
                {recentQueries.length > 0 ? (
                  recentQueries.slice(0, 5).map((queryItem) => (
                    <Pressable
                      key={queryItem}
                      style={styles.historyItem}
                      onPress={() => controller.setQuery(queryItem)}
                    >
                      <Text style={{ color: colors.text }}>{queryItem}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No hay búsquedas recientes
                  </Text>
                )}
              </View>
              <View style={styles.resultItemWrap}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  Vistos recientemente
                </Text>
                {recentViewedItems.length > 0 ? (
                  recentViewedItems.slice(0, 10).map((item, idx) => (
                    <View key={keyFor(item, idx)}>{renderItem(item)}</View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No hay spots vistos recientemente
                  </Text>
                )}
              </View>
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

          {isSearch && controller.results.length === 0 && (
            <>
              {controller.suggestions.length > 0 && (
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
              <View style={styles.noResults}>
                <ButtonPrimary
                  onPress={controller.onCreate}
                  accessibilityLabel={q ? `Crear "${q}"` : onCreateLabel}
                >
                  {q ? `Crear "${q}"` : onCreateLabel}
                </ButtonPrimary>
              </View>
            </>
          )}
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 10,
  },
  sheetRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    zIndex: 15,
  },
  sheetPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SEARCH_PANEL_PADDING,
    paddingBottom: SEARCH_PANEL_PADDING,
  },
  dragArea: {
    flexShrink: 0,
  },
  handleRow: {
    paddingTop: 8,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchPill: {
    flex: 1,
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsArea: {
    flex: 1,
    minHeight: 0,
    marginTop: Spacing.sm,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  resultItemWrap: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  historyItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  suggestionsSection: {
    marginBottom: Spacing.base,
  },
  suggestionRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.sm,
  },
  noResults: {
    marginTop: Spacing.base,
    alignItems: 'center',
    gap: Spacing.base,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
