/**
 * SearchOverlayWeb — Overlay modal full-screen de búsqueda (solo WEB).
 * CONTRATO: Search Fullscreen Overlay — cubre viewport; body scroll-lock; panel overlayScrim; zIndex alto.
 * SpotSheet no se renderiza cuando isOpen (MapScreenVNext).
 * CONTRATO: Keyboard-safe — NO 100vh; usar 100dvh o fallback visualViewport.height; --app-height en :root.
 * CONTRATO: Un solo scroller — ramas isEmpty/isPreSearch/isSearch mutuamente excluyentes; solo 1 ScrollView visible a la vez.
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { IconButton } from '@/components/design-system/icon-button';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Search, X } from 'lucide-react-native';
import { SearchInputV2 } from './SearchInputV2';
import { SearchResultsListV2 } from './SearchResultsListV2';
import type { SearchFloatingProps } from './types';

const PANEL_PADDING_H = 16;
const PANEL_PADDING_TOP = 16;
const PANEL_PADDING_BOTTOM = 0;
const HEADER_PILL_RADIUS = 22;
const HEADER_ROW_HEIGHT = 44;

export function SearchOverlayWeb<T>({
  controller,
  defaultItems,
  recentQueries,
  recentViewedItems,
  renderItem,
  stageLabel,
  emptyMessage = 'No hay spots cercanos. Mantén pulsado el mapa para crear uno.',
  onCreateLabel = 'Crear nuevo spot',
  getItemKey,
}: SearchFloatingProps<T>) {
  const keyFor = (item: T, idx: number) => (getItemKey ? getItemKey(item) : `item-${idx}`);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const savedOverflowRef = useRef<string | null>(null);
  const savedScrollYRef = useRef(0);

  /** Keyboard-safe: 100dvh o fallback visualViewport.height. NO 100vh. */
  const supportsDvh =
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('height', '100dvh');

  useEffect(() => {
    if (!controller.isOpen || typeof window === 'undefined' || typeof document === 'undefined') return;
    const root = document.documentElement;
    const vv = window.visualViewport;
    const setAppHeight = () => {
      if (supportsDvh) {
        root.style.setProperty('--app-height', '100dvh');
      } else if (vv) {
        root.style.setProperty('--app-height', `${Math.round(vv.height)}px`);
      } else {
        root.style.setProperty('--app-height', `${window.innerHeight}px`);
      }
    };
    setAppHeight();
    if (!supportsDvh && vv) {
      vv.addEventListener('resize', setAppHeight);
      vv.addEventListener('scroll', setAppHeight);
    }
    return () => {
      if (!supportsDvh && vv) {
        vv.removeEventListener('resize', setAppHeight);
        vv.removeEventListener('scroll', setAppHeight);
      }
      root.style.removeProperty('--app-height');
    };
  }, [controller.isOpen, supportsDvh]);

  useEffect(() => {
    if (!controller.isOpen) return;
    const scrollY = window.scrollY ?? document.documentElement.scrollTop ?? 0;
    savedScrollYRef.current = scrollY;
    savedOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (document.body.style as Record<string, string>).position = 'fixed';
    (document.body.style as Record<string, string>).top = `-${scrollY}px`;
    (document.body.style as Record<string, string>).left = '0';
    (document.body.style as Record<string, string>).right = '0';
    (document.body.style as Record<string, string>).overscrollBehavior = 'none';
    return () => {
      (document.body.style as Record<string, string>).position = '';
      (document.body.style as Record<string, string>).top = '';
      (document.body.style as Record<string, string>).left = '';
      (document.body.style as Record<string, string>).right = '';
      (document.body.style as Record<string, string>).overscrollBehavior = '';
      document.body.style.overflow = savedOverflowRef.current ?? '';
      savedOverflowRef.current = null;
      window.scrollTo(0, savedScrollYRef.current);
    };
  }, [controller.isOpen]);

  const blurActiveElement = useCallback(() => {
    const el = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    if (el?.blur) el.blur();
  }, []);

  const doClose = useCallback(() => controller.setOpen(false), [controller]);

  const onClosePress = useCallback(() => {
    doClose();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => blurActiveElement());
    } else {
      setTimeout(blurActiveElement, 0);
    }
  }, [doClose, blurActiveElement]);

  const onBackdropPress = useCallback(() => {
    if (isInputFocused) blurActiveElement();
    else doClose();
  }, [isInputFocused, blurActiveElement, doClose]);

  const q = controller.query.trim();
  const len = q.length;
  const isEmpty = len === 0;
  const isPreSearch = len > 0 && len < 3;
  const isSearch = len >= 3;
  /** Estado "Sin resultados" (contrato SEARCH_NO_RESULTS_CREATE_CHOOSER): query >= threshold, results vacío, no loading. */
  const isNoResults = isSearch && controller.results.length === 0 && !controller.isLoading;

  if (!controller.isOpen) return null;

  return (
    <View
      style={[
        styles.overlayBase,
        Platform.OS === 'web' && styles.overlayWebFixed,
        Platform.OS === 'web' && styles.overlayWebLock,
      ]}
      pointerEvents="auto"
    >
      <Pressable style={styles.backdrop} onPress={onBackdropPress} />
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.overlayScrim,
            paddingTop: Math.max(insets.top, PANEL_PADDING_TOP),
            paddingBottom: PANEL_PADDING_BOTTOM,
            paddingLeft: PANEL_PADDING_H,
            paddingRight: PANEL_PADDING_H,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <View style={[styles.searchPill, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
            <Search size={20} color={colors.textSecondary} strokeWidth={2} />
            <SearchInputV2
              value={controller.query}
              onChangeText={controller.setQuery}
              onClear={controller.clear}
              placeholder="Buscar lugares…"
              autoFocus
              embedded
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>
          <IconButton
            variant="default"
            onPress={onClosePress}
            accessibilityLabel="Cerrar búsqueda"
          >
            <X size={24} color={colors.text} strokeWidth={2} />
          </IconButton>
        </View>
        {/* CONTRATO: Un solo scroller por estado (isEmpty | isPreSearch | isSearch | isNoResults); no anidar scrolls. */}
        <View style={styles.resultsArea}>
          {isEmpty && defaultItems.length > 0 && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Cercanos</Text>
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
              showsVerticalScrollIndicator
            >
              {recentQueries.length > 0 && (
                <View style={styles.resultItemWrap}>
                  <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Búsquedas recientes</Text>
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
                  <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Vistos recientemente</Text>
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
            <>
              {controller.suggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Sugerencias</Text>
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
              <View style={styles.chooserSection}>
                <Pressable
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    styles.chooserRow,
                    { backgroundColor: pressed ? colors.borderSubtle : 'transparent' },
                  ]}
                  onPress={controller.onCreate}
                  accessibilityLabel="Crear spot nuevo aquí. Usará el centro del mapa."
                  accessibilityRole="button"
                >
                  <View style={styles.chooserRowContent}>
                    <Text style={[styles.chooserRowTitle, { color: colors.text }]}>Crear spot nuevo aquí</Text>
                    <Text style={[styles.chooserRowSubtitle, { color: colors.textSecondary }]}>Usará el centro del mapa</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayBase: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 15,
  },
  overlayWebFixed:
    Platform.OS === 'web'
      ? {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--app-height, 100dvh)',
        }
      : {},
  overlayWebLock:
    Platform.OS === 'web'
      ? { touchAction: 'none' as const }
      : {},
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexShrink: 0,
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
  resultsArea: {
    flex: 1,
    minHeight: 0,
  },
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
  suggestionsSection: { marginBottom: Spacing.base },
  suggestionRow: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderRadius: Radius.sm },
  chooserSection: { marginTop: Spacing.sm },
  chooserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chooserRowContent: { gap: 2, flex: 1, minWidth: 0 },
  chooserRowTitle: { fontSize: 16, fontWeight: '600' },
  chooserRowSubtitle: { fontSize: 13 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
