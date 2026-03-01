/**
 * SearchOverlayWeb — Overlay modal full-screen de búsqueda (solo WEB).
 * CONTRATO: Search Fullscreen Overlay — cubre viewport; body scroll-lock; panel overlayScrim; zIndex alto.
 * SpotSheet no se renderiza cuando isOpen (MapScreenVNext).
 * CONTRATO: Keyboard-safe — NO 100vh; usar 100dvh o fallback visualViewport.height; --app-height en :root.
 * OL-WOW-F2-001: contenido unificado en SearchSurface.
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchSurface } from './SearchSurface';
import type { SearchFloatingProps } from './types';

const PANEL_PADDING_H = 16;
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
  showResultsOnEmpty = false,
  getItemKey,
  pinFilter,
  pinCounts,
  onPinFilterChange,
  placeSuggestions = [],
  onCreateFromPlace,
  activitySummary,
}: SearchFloatingProps<T>) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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

  return (
    <View
      style={[
        styles.overlayBase,
        Platform.OS === 'web' && styles.overlayWebFixed,
        Platform.OS === 'web' && styles.overlayWebLock,
        { pointerEvents: 'auto' },
      ]}
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
          { pointerEvents: 'box-none' },
        ]}
      >
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
          showResultsOnEmpty={showResultsOnEmpty}
          getItemKey={getItemKey}
          pinFilter={pinFilter}
          pinCounts={pinCounts}
          onPinFilterChange={onPinFilterChange}
          placeSuggestions={placeSuggestions}
          onCreateFromPlace={onCreateFromPlace}
          activitySummary={activitySummary}
          onClosePress={onClosePress}
          onScrollDismissKeyboard={handleScrollDismissKeyboard}
          scrollViewKeyboardDismissMode="none"
          onInputFocus={() => setIsInputFocused(true)}
          onInputBlur={() => setIsInputFocused(false)}
        />
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
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
});
