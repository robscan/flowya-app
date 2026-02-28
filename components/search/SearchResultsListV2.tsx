/**
 * Search V2: listado por secciones. Preparado para onEndReached → fetchMore (S2).
 * UI canónica: solo recibe results/sections y callbacks; no conoce mode ni strategy.
 */

import React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export type SearchSection<T> = {
  id: string;
  title: string;
  items: T[];
};

export type SearchResultsListV2Props<T> = {
  sections: SearchSection<T>[];
  /** Lista plana cuando no se usan secciones (mismo orden que results del controller). */
  results: T[];
  renderItem: (item: T) => React.ReactNode;
  renderSectionHeader?: (section: SearchSection<T>) => React.ReactNode;
  onEndReached?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  /** Contrato KEYBOARD_AND_TEXT_INPUTS: scroll cierra teclado. */
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  /** Web: llamado al hacer scroll para cerrar teclado (blur). Recibe contentOffset.y para throttling. */
  onScrollDismissKeyboard?: (contentOffsetY: number) => void;
  /** Contenido opcional al final del listado (misma columna/scroll). */
  footer?: React.ReactNode;
};
/** Alias canónico DS para infra de listados. */
export type ListViewProps<T> = SearchResultsListV2Props<T>;

export function SearchResultsListV2<T>({
  sections,
  results,
  renderItem,
  renderSectionHeader,
  onEndReached,
  hasMore = false,
  isLoading = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  onScrollDismissKeyboard,
  footer,
}: SearchResultsListV2Props<T>) {
  const showSections = sections.length > 0;
  const showFlat = !showSections && results.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { nativeEvent } = e;
        onScrollDismissKeyboard?.(nativeEvent.contentOffset.y);
        if (!onEndReached || isLoading || !hasMore) return;
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const padding = 80;
        const nearEnd =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - padding;
        if (nearEnd) onEndReached();
      }}
      scrollEventThrottle={200}
      showsVerticalScrollIndicator
    >
      {showSections &&
        sections.map((section) => (
          <View key={section.id} style={styles.section}>
            {renderSectionHeader ? (
              renderSectionHeader(section)
            ) : (
              <View style={styles.sectionHeaderPlaceholder} />
            )}
            {section.items.map((item, i) => (
              <View key={i} style={styles.itemWrap}>
                {renderItem(item)}
              </View>
            ))}
          </View>
        ))}
      {showFlat &&
        results.map((item, i) => (
          <View key={i} style={styles.itemWrap}>
            {renderItem(item)}
          </View>
        ))}
      {footer ? <View style={styles.footerWrap}>{footer}</View> : null}
    </ScrollView>
  );
}

/** Alias canónico DS para migración progresiva sin ruptura. */
export const ListView = SearchResultsListV2;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeaderPlaceholder: {
    minHeight: 24,
  },
  itemWrap: {
    width: '100%',
  },
  footerWrap: {
    width: '100%',
  },
});
