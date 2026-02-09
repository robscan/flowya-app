/**
 * SearchFloating — Buscador flotante transversal (sin sheet).
 * Encapsula SearchInputV2 + SearchResultsListV2 + backdrop.
 * El padre inyecta el controller (useSearchControllerV2) y los datos de contexto.
 *
 * Contrato (pensando en futuro search_core):
 * - controller: retorno de useSearchControllerV2<T> (query, results, setOpen, onSelect, etc.)
 * - defaultItems: items a mostrar cuando query está vacío (ej. "Cercanos")
 * - recentQueries / recentViewedItems: para estado pre-búsqueda (< 3 chars)
 * - renderItem: (item: T) => ReactNode
 * - scope: contexto de sección (ej. "explorar"); por ahora no cambia ranking
 * - stageLabel: etiqueta de etapa (ej. "En esta zona")
 * - emptyMessage / onCreateLabel: mensajes y CTA crear
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ButtonPrimary } from '@/components/design-system/buttons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { SearchInputV2 } from './SearchInputV2';
import { SearchResultsListV2 } from './SearchResultsListV2';
import type { SearchFloatingProps } from './types';

const SEARCH_PANEL_PADDING = 16;
const SHEET_TOP_INSET = 24;
const SHEET_BORDER_RADIUS = 24;
const HEADER_PILL_RADIUS = 22;
const HEADER_ROW_HEIGHT = 44;
const HEADER_TOP_PADDING = 16;

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
  const topInset = insetsProp?.top ?? 0;
  const sheetTop = topInset + SHEET_TOP_INSET;

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
        onPress={() => controller.setOpen(false)}
      />
      <View
        style={[
          styles.sheet,
          {
            top: sheetTop,
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSubtle,
            pointerEvents: 'box-none',
          },
        ]}
      >
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
            onPress={() => controller.setOpen(false)}
            accessibilityLabel="Cerrar búsqueda"
            accessibilityRole="button"
          >
            <X size={24} color={colors.text} strokeWidth={2} />
          </Pressable>
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SEARCH_PANEL_PADDING,
    paddingBottom: SEARCH_PANEL_PADDING,
    zIndex: 15,
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
