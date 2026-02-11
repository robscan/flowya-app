/**
 * SearchOverlayWeb — Overlay modal de búsqueda solo para WEB.
 * Sin sheet, sin gestos, sin handle. Overlay transparente; panel sólido; un solo scroll (lista).
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ButtonPrimary } from '@/components/design-system/buttons';
import { IconButton } from '@/components/design-system/icon-button';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
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

  const getViewportRect = useCallback(() => {
    if (typeof window === 'undefined')
      return { top: 0, left: 0, width: 0, height: 0 };
    const vv = window.visualViewport;
    if (vv)
      return {
        top: vv.offsetTop,
        left: vv.offsetLeft,
        width: vv.width,
        height: vv.height,
      };
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  const [viewportRect, setViewportRect] = useState(() => getViewportRect());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setViewportRect(getViewportRect());
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [getViewportRect]);

  useEffect(() => {
    if (!controller.isOpen) return;
    setViewportRect(getViewportRect());
  }, [controller.isOpen, getViewportRect]);

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

  if (!controller.isOpen) return null;

  const overlaySizeStyle = {
    top: viewportRect.top,
    left: viewportRect.left,
    width: viewportRect.width,
    height: viewportRect.height,
  };

  return (
    <View
      style={[
        styles.overlayBase,
        overlaySizeStyle,
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
        <View style={styles.resultsArea}>
          {isEmpty && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Cercanos</Text>
              {defaultItems.length > 0
                ? defaultItems.map((item, idx) => (
                    <View key={keyFor(item, idx)} style={styles.resultItemWrap}>
                      {renderItem(item)}
                    </View>
                  ))
                : (
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
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Búsquedas recientes</Text>
                {recentQueries.length > 0
                  ? recentQueries.slice(0, 5).map((queryItem) => (
                      <Pressable
                        key={queryItem}
                        style={styles.historyItem}
                        onPress={() => controller.setQuery(queryItem)}
                      >
                        <Text style={{ color: colors.text }}>{queryItem}</Text>
                      </Pressable>
                    ))
                  : (
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay búsquedas recientes</Text>
                    )}
              </View>
              <View style={styles.resultItemWrap}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Vistos recientemente</Text>
                {recentViewedItems.length > 0
                  ? recentViewedItems.slice(0, 10).map((item, idx) => (
                      <View key={keyFor(item, idx)}>{renderItem(item)}</View>
                    ))
                  : (
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay spots vistos recientemente</Text>
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
  noResults: { marginTop: Spacing.base, alignItems: 'center', gap: Spacing.base },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
