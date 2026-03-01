/**
 * SearchFloatingNative — Sheet de búsqueda con drag-to-dismiss (solo Native).
 * No body overflow ni visualViewport; solo iOS/Android.
 * OL-WOW-F2-001: contenido unificado en SearchSurface.
 */

import { SheetHandle } from '@/components/design-system/sheet-handle';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
import { SearchSurface } from './SearchSurface';
import type { SearchFloatingProps } from './types';

const SEARCH_PANEL_PADDING = 16;
const SHEET_BORDER_RADIUS = 24;
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

  if (!controller.isOpen) return null;

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.scrim,
          { backgroundColor: colors.overlayScrim, pointerEvents: 'none' },
        ]}
      />
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
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={[styles.keyboardAvoid, { paddingTop: HEADER_TOP_PADDING }]}
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
                    onClosePress={requestClose}
                    scrollViewKeyboardDismissMode="on-drag"
                  />
                </KeyboardAvoidingView>
              </View>
            </GestureDetector>
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { zIndex: 10 },
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
  dragArea: { flex: 1, minHeight: 0 },
  handleRow: { paddingTop: 8, marginBottom: 4 },
  keyboardAvoid: { flex: 1, minHeight: 0 },
});
