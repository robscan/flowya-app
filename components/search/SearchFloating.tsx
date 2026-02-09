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

import type { UseSearchControllerV2Return } from '@/hooks/search/useSearchControllerV2';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ButtonPrimary } from '@/components/design-system/buttons';
import { SearchInputV2, SearchResultsListV2 } from '@/components/search';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type SearchFloatingProps<T> = {
  /** Controller de Search V2 (useSearchControllerV2); el padre configura setOnSelect/setOnCreate. */
  controller: UseSearchControllerV2Return<T>;
  /** Items a mostrar cuando la query está vacía (ej. "Cercanos"). */
  defaultItems: T[];
  /** Queries recientes para estado pre-búsqueda. */
  recentQueries: string[];
  /** Items vistos recientemente (por id). */
  recentViewedItems: T[];
  /** Render de cada item en listados. */
  renderItem: (item: T) => React.ReactNode;
  /** Etiqueta de etapa cuando hay resultados (ej. "En esta zona"). */
  stageLabel: string;
  /** Mensaje cuando no hay items cercanos (query vacía). */
  emptyMessage?: string;
  /** Texto del CTA crear cuando no hay resultados (query >= 3). */
  onCreateLabel?: string;
  /** Contexto de sección para futuro ranking; por ahora no se usa. */
  scope?: string;
  /** Key estable para items en listas (ej. item => item.id). */
  getItemKey?: (item: T) => string;
};

const SEARCH_PANEL_PADDING = 16;

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
}: SearchFloatingProps<T>) {
  const keyFor = (item: T, idx: number) => (getItemKey ? getItemKey(item) : `item-${idx}`);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
          },
        ]}
        onPress={() => controller.setOpen(false)}
        pointerEvents="auto"
      />
      <View style={styles.panel} pointerEvents="box-none">
        <View style={styles.inputWrap}>
          <SearchInputV2
            value={controller.query}
            onChangeText={controller.setQuery}
            onClear={controller.clear}
            placeholder="Buscar lugares…"
            autoFocus
          />
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
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: SEARCH_PANEL_PADDING,
    zIndex: 15,
  },
  inputWrap: {
    marginTop: Spacing.sm,
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
