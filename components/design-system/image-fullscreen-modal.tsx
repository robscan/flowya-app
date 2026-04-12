/**
 * Design System: ImageFullscreenModal (Scope C + OL-CONTENT-002 galería).
 * Lightbox a pantalla completa: cierre con botón X, `Modal.onRequestClose` (atrás en Android) y atajos web opcionales.
 */

import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const THUMB_SIZE = 44;
const THUMB_GAP = 8;
const CHROME_ICON = 24;
const NAV_HIT = 48;
const CLOSE_HIT = 44;

export type ImageFullscreenModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Modo legacy: una sola URL. */
  uri?: string | null;
  /** Modo galería: varias URLs (si length > 0, tiene prioridad sobre `uri`). */
  uris?: string[];
  /** Índice inicial en modo galería (clamped). */
  initialIndex?: number;
};

export function ImageFullscreenModal({
  visible,
  uri,
  uris,
  initialIndex = 0,
  onClose,
}: ImageFullscreenModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const stagePixelHeight =
    winH > 0 ? winH : Dimensions.get('window').height || 640;
  const pageW = Math.max(1, winW);
  const pageH = Math.max(1, stagePixelHeight);

  const listRef = useRef<FlatList<string>>(null);
  const thumbScrollRef = useRef<ScrollView>(null);

  const gallery =
    uris && uris.length > 1 ? uris : null;
  const singleUri =
    gallery != null
      ? null
      : uri ?? (uris && uris.length === 1 ? uris[0]! : null);
  const [page, setPage] = useState(0);

  const goToIndex = useCallback(
    (index: number, animated = true) => {
      if (!gallery?.length || pageW <= 0) return;
      const i = Math.min(Math.max(0, index), gallery.length - 1);
      setPage(i);
      listRef.current?.scrollToIndex({ index: i, animated });
    },
    [gallery, pageW],
  );

  const goPrev = useCallback(() => {
    goToIndex(page - 1);
  }, [goToIndex, page]);

  const goNext = useCallback(() => {
    goToIndex(page + 1);
  }, [goToIndex, page]);

  useEffect(() => {
    if (!visible || !gallery?.length) return;
    const idx = Math.min(Math.max(0, initialIndex), gallery.length - 1);
    setPage(idx);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: false });
    });
  }, [visible, gallery, initialIndex]);

  useEffect(() => {
    if (!visible || !gallery?.length || !thumbScrollRef.current) return;
    const pad = THUMB_GAP;
    const x = Math.max(
      0,
      page * (THUMB_SIZE + pad) - pageW / 2 + THUMB_SIZE / 2,
    );
    thumbScrollRef.current.scrollTo({ x, animated: true });
  }, [page, visible, gallery?.length, pageW]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!gallery || gallery.length < 2) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, gallery, onClose, goPrev, goNext]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!gallery?.length || pageW <= 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / pageW);
      setPage(Math.min(Math.max(0, i), gallery.length - 1));
    },
    [gallery?.length, pageW],
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: false,
        });
      }, 120);
    },
    [],
  );

  if (!visible) {
    return null;
  }

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 12);
  const hasMulti = Boolean(gallery && gallery.length > 1);
  const canPrev = hasMulti && page > 0;
  const canNext = hasMulti && page < (gallery?.length ?? 0) - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.surface}>
        <View
          style={styles.contentLayer}
          pointerEvents="box-none"
          accessibilityViewIsModal
        >
          <View style={[styles.chrome, { paddingTop: topPad }]} pointerEvents="box-none">
            <View style={styles.topRow}>
              {hasMulti ? (
                <View style={styles.counterCenter} pointerEvents="none">
                  <View style={styles.counterPill}>
                    <Text style={styles.counterText}>
                      {page + 1} / {gallery!.length}
                    </Text>
                  </View>
                </View>
              ) : null}
              <Pressable
                onPress={onClose}
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeFab,
                  hasMulti && styles.closeFabCorner,
                  pressed && styles.closeFabPressed,
                  Platform.OS === 'web' && { cursor: 'pointer' as const },
                ]}
              >
                <X size={22} color="#fff" strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          <View style={styles.stage} pointerEvents="box-none">
            {gallery && gallery.length > 0 ? (
              <>
                <FlatList
                  ref={listRef}
                  data={gallery}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onScrollEnd}
                  onScrollToIndexFailed={onScrollToIndexFailed}
                  getItemLayout={(_, index) => ({
                    length: pageW,
                    offset: pageW * index,
                    index,
                  })}
                  initialNumToRender={3}
                  style={[styles.flatListRaise, styles.flatListFill]}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.page,
                        { width: pageW, height: pageH },
                      ]}
                    >
                      <Image
                        source={{ uri: item }}
                        style={styles.image}
                        contentFit="contain"
                      />
                    </View>
                  )}
                />

                {hasMulti ? (
                  <>
                    <Pressable
                      disabled={!canPrev}
                      onPress={() => {
                        if (canPrev) goPrev();
                      }}
                      style={({ pressed }) => [
                        styles.navSide,
                        styles.navLeft,
                        !canPrev && styles.navDisabled,
                        pressed && canPrev && styles.navPressed,
                        Platform.OS === 'web' && canPrev && { cursor: 'pointer' as const },
                      ]}
                      accessibilityLabel="Imagen anterior"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canPrev }}
                      hitSlop={8}
                    >
                      <ChevronLeft
                        size={CHROME_ICON + 4}
                        color={canPrev ? '#fff' : 'rgba(255,255,255,0.35)'}
                        strokeWidth={2}
                      />
                    </Pressable>
                    <Pressable
                      disabled={!canNext}
                      onPress={() => {
                        if (canNext) goNext();
                      }}
                      style={({ pressed }) => [
                        styles.navSide,
                        styles.navRight,
                        !canNext && styles.navDisabled,
                        pressed && canNext && styles.navPressed,
                        Platform.OS === 'web' && canNext && { cursor: 'pointer' as const },
                      ]}
                      accessibilityLabel="Imagen siguiente"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canNext }}
                      hitSlop={8}
                    >
                      <ChevronRight
                        size={CHROME_ICON + 4}
                        color={canNext ? '#fff' : 'rgba(255,255,255,0.35)'}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </>
                ) : null}
              </>
            ) : singleUri ? (
              <View style={styles.imageWrap} pointerEvents="box-none">
                <Image
                  source={{ uri: singleUri }}
                  style={styles.image}
                  contentFit="contain"
                />
              </View>
            ) : null}
          </View>

          {hasMulti && gallery ? (
            <View style={[styles.thumbBar, { paddingBottom: bottomPad }]}>
              <ScrollView
                ref={thumbScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {gallery.map((thumbUri, index) => {
                  const selected = index === page;
                  return (
                    <Pressable
                      key={`${thumbUri}-${index}`}
                      onPress={() => goToIndex(index)}
                      accessibilityLabel={`Ir a la imagen ${index + 1} de ${gallery.length}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={({ pressed }) => [
                        styles.thumbOuter,
                        selected && [
                          styles.thumbOuterSelected,
                          { borderColor: colors.primary },
                        ],
                        pressed && styles.thumbPressed,
                      ]}
                    >
                      <Image
                        source={{ uri: thumbUri }}
                        style={styles.thumbImage}
                        contentFit="cover"
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  contentLayer: {
    flex: 1,
    width: '100%',
  },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    minHeight: CLOSE_HIT,
  },
  counterCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  closeFab: {
    width: CLOSE_HIT,
    height: CLOSE_HIT,
    borderRadius: CLOSE_HIT / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeFabCorner: {
    zIndex: 2,
  },
  closeFabPressed: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  flatListRaise: {
    zIndex: 10,
  },
  flatListFill: {
    flex: 1,
    width: '100%',
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navSide: {
    position: 'absolute',
    top: '50%',
    marginTop: -NAV_HIT / 2,
    width: NAV_HIT,
    height: NAV_HIT,
    borderRadius: NAV_HIT / 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  navLeft: {
    left: 12,
  },
  navRight: {
    right: 12,
  },
  navDisabled: {
    opacity: 0.4,
  },
  navPressed: {
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  thumbBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  thumbScrollContent: {
    paddingHorizontal: 16,
    gap: THUMB_GAP,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbOuter: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbOuterSelected: {
    borderWidth: 2,
  },
  thumbPressed: {
    opacity: 0.85,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
