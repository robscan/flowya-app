/**
 * SearchOverlayWeb — Overlay de búsqueda (solo WEB).
 * - Viewport &lt;1080 (tablet): panel centrado con tope WR-01 (comportamiento previo).
 * - Viewport ≥1080 (Explore desktop): misma columna lateral que welcome/países/ficha — ancho panel,
 *   revelado por ancho, mapa visible a la derecha con velo táctil.
 * CONTRATO: Keyboard-safe — NO 100vh; usar 100dvh / --app-height.
 * OL-WOW-F2-001: contenido unificado en SearchSurface.
 */

import { ExploreDesktopSidebarAnimatedColumn } from '@/components/explorar/ExploreDesktopSidebarAnimatedColumn';
import { Colors, webViewStyle } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  WEB_PANEL_PADDING_H,
  WEB_SEARCH_OVERLAY_MAX_WIDTH,
  webExploreUsesDesktopSidebar,
  webSearchUsesConstrainedPanelWidth,
} from '@/lib/web-layout';
import { getSearchPanelSurfaceColors } from '@/lib/search/searchPanelSurface';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchSurface } from './SearchSurface';
import type { SearchFloatingProps } from './types';

const PANEL_PADDING_H = WEB_PANEL_PADDING_H;
const PANEL_PADDING_TOP = 16;
const PANEL_PADDING_BOTTOM = 0;

export function SearchOverlayWeb<T>({
  controller,
  defaultItems,
  defaultItemSections = [],
  recentQueries,
  recentViewedItems,
  renderItem,
  stageLabel: _stageLabel,
  resultsOverride,
  resultSections = [],
  resultsSummaryLabel,
  showResultsOnEmpty = false,
  getItemKey,
  pinFilter,
  pinCounts,
  onPinFilterChange,
  tagFilterOptions = [],
  selectedTagFilterIds = [],
  onTagFilterChange,
  tagFilterEditMode = false,
  onTagFilterEnterEditMode,
  onTagFilterExitEditMode,
  onRequestDeleteUserTag,
  placeSuggestions = [],
  onCreateFromPlace,
  searchInputAutoFocus = true,
  placesFiltersBar,
  placesListFirstSectionHeaderRight,
}: SearchFloatingProps<T>) {
  const { width: windowWidth } = useWindowDimensions();
  const constrainSearchPanel =
    Platform.OS === 'web' && webSearchUsesConstrainedPanelWidth(windowWidth);
  const useDesktopExploreSidebarLayout =
    Platform.OS === 'web' && webExploreUsesDesktopSidebar(windowWidth);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const panelSurface = useMemo(
    () => getSearchPanelSurfaceColors(pinFilter, scheme, 'web'),
    [pinFilter, scheme],
  );
  const [isInputFocused, setIsInputFocused] = useState(false);
  const savedOverflowRef = useRef<string | null>(null);
  const savedScrollYRef = useRef(0);
  const lastScrollYRef = useRef(0);

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
    const bodyStyle = document.body.style as unknown as Record<string, string>;
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = '0';
    bodyStyle.right = '0';
    bodyStyle.overscrollBehavior = 'none';
    return () => {
      bodyStyle.position = '';
      bodyStyle.top = '';
      bodyStyle.left = '';
      bodyStyle.right = '';
      bodyStyle.overscrollBehavior = '';
      document.body.style.overflow = savedOverflowRef.current ?? '';
      savedOverflowRef.current = null;
      window.scrollTo(0, savedScrollYRef.current);
    };
  }, [controller.isOpen]);

  const blurActiveElement = useCallback(() => {
    const el = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    if (el?.blur) el.blur();
  }, []);

  /** Contrato KEYBOARD_AND_TEXT_INPUTS: scroll cierra teclado (web). */
  const handleScrollDismissKeyboard = useCallback(
    (contentOffsetY: number) => {
      if (Math.abs(contentOffsetY - lastScrollYRef.current) > 15) {
        lastScrollYRef.current = contentOffsetY;
        blurActiveElement();
      }
    },
    [blurActiveElement]
  );

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
  }, [isInputFocused, blurActiveElement]);

  if (!controller.isOpen) return null;

  const searchSurfaceEl = (
    <SearchSurface
      controller={controller}
      defaultItems={defaultItems}
      defaultItemSections={defaultItemSections}
      recentQueries={recentQueries}
      recentViewedItems={recentViewedItems}
      renderItem={renderItem}
      stageLabel=""
      resultsOverride={resultsOverride}
      resultSections={resultSections}
      resultsSummaryLabel={resultsSummaryLabel}
      showResultsOnEmpty={showResultsOnEmpty}
      getItemKey={getItemKey}
      pinFilter={pinFilter}
      pinCounts={pinCounts}
      onPinFilterChange={onPinFilterChange}
      tagFilterOptions={tagFilterOptions}
      selectedTagFilterIds={selectedTagFilterIds}
      onTagFilterChange={onTagFilterChange}
      tagFilterEditMode={tagFilterEditMode}
      onTagFilterEnterEditMode={onTagFilterEnterEditMode}
      onTagFilterExitEditMode={onTagFilterExitEditMode}
      onRequestDeleteUserTag={onRequestDeleteUserTag}
      placeSuggestions={placeSuggestions}
      onCreateFromPlace={onCreateFromPlace}
      onClosePress={onClosePress}
      onScrollDismissKeyboard={handleScrollDismissKeyboard}
      scrollViewKeyboardDismissMode="none"
      onInputFocus={() => setIsInputFocused(true)}
      onInputBlur={() => setIsInputFocused(false)}
      searchInputAutoFocus={searchInputAutoFocus}
      placesFiltersBar={placesFiltersBar}
      placesListFirstSectionHeaderRight={placesListFirstSectionHeaderRight}
    />
  );

  const panelPaddingStyle = {
    paddingTop: Math.max(insets.top, PANEL_PADDING_TOP),
    paddingBottom: PANEL_PADDING_BOTTOM,
    paddingLeft: PANEL_PADDING_H,
    paddingRight: PANEL_PADDING_H,
  } as const;

  if (useDesktopExploreSidebarLayout) {
    const borderColor = Colors[scheme].borderSubtle;
    return (
      <View
        style={[
          styles.overlayBase,
          Platform.OS === 'web' && styles.overlayWebFixed,
          styles.overlayDesktopSplit,
          { pointerEvents: 'auto' },
        ]}
      >
        <ExploreDesktopSidebarAnimatedColumn
          presenceOpen
          panelWidth={WEB_SEARCH_OVERLAY_MAX_WIDTH}
          style={[
            styles.desktopSearchSidebar,
            {
              borderRightColor: borderColor,
              backgroundColor: panelSurface.backgroundColor,
            },
          ]}
        >
          <View
            style={[
              styles.desktopSearchPanelInner,
              panelPaddingStyle,
              styles.panel,
              Platform.OS === 'web' && styles.panelWebScroll,
              { pointerEvents: 'box-none' },
            ]}
          >
            {searchSurfaceEl}
          </View>
        </ExploreDesktopSidebarAnimatedColumn>
        <Pressable
          style={styles.desktopSearchMapScrim}
          onPress={onClosePress}
          accessibilityLabel="Cerrar búsqueda"
          accessibilityRole="button"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.overlayBase,
        Platform.OS === 'web' && styles.overlayWebFixed,
        { pointerEvents: 'auto' },
      ]}
    >
      {/**
       * touchAction: none solo en el backdrop (no en el contenedor raíz): si el padre
       * del panel tenía none, en web el gesto de scroll no llegaba a los ScrollView del listado.
       */}
      <Pressable
        style={[styles.backdrop, Platform.OS === 'web' && styles.backdropWebLock]}
        onPress={onBackdropPress}
      />
      <View
        style={[
          styles.panelHost,
          constrainSearchPanel && styles.panelHostAlignCenter,
        ]}
      >
        <View
          style={[
            styles.panel,
            Platform.OS === 'web' && styles.panelWebScroll,
            constrainSearchPanel && {
              maxWidth: WEB_SEARCH_OVERLAY_MAX_WIDTH,
              width: '100%' as DimensionValue,
            },
            {
              backgroundColor: panelSurface.backgroundColor,
              ...panelPaddingStyle,
            },
            { pointerEvents: 'box-none' },
          ]}
        >
          {searchSurfaceEl}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 15,
  } satisfies ViewStyle,
  overlayWebFixed:
    webViewStyle({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--app-height, 100dvh)' as DimensionValue,
    }),
  backdropWebLock:
    webViewStyle({ touchAction: 'none' }),
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  } satisfies ViewStyle,
  panelHost: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  } satisfies ViewStyle,
  panelHostAlignCenter:
    Platform.OS === 'web'
      ? { alignItems: 'center' as const }
      : ({} satisfies ViewStyle),
  panel: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  } satisfies ViewStyle,
  /** Asegura scroll vertical en listados dentro del overlay (web). */
  panelWebScroll:
    webViewStyle({ touchAction: 'pan-y' }),
  overlayDesktopSplit:
    Platform.OS === 'web'
      ? {
          flexDirection: 'row' as const,
          alignItems: 'stretch' as const,
          width: '100%' as DimensionValue,
          height: 'var(--app-height, 100dvh)' as DimensionValue,
        }
      : ({} satisfies ViewStyle),
  desktopSearchSidebar: {
    flexShrink: 0,
    minHeight: 0,
    alignSelf: 'stretch',
    borderRightWidth: StyleSheet.hairlineWidth,
    flexDirection: 'column',
  } satisfies ViewStyle,
  desktopSearchPanelInner: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  } satisfies ViewStyle,
  desktopSearchMapScrim: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  } satisfies ViewStyle,
});
