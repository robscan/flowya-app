/**
 * SpotSheet — Sheet inferior estilo Apple Maps (Explorar vNext).
 * 3 estados: PEEK (solo header), MEDIUM (header + resumen), EXPANDED (header + resumen con más espacio).
 * La lógica de estado vive en MapScreenVNext; SpotSheet solo renderiza según state.
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { IconButton } from '@/components/design-system/icon-button';
import { SpotImage } from '@/components/design-system/spot-image';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { distanceKm, formatDistanceKm, getMapsDirectionsUrl } from '@/lib/geo-utils';
import { CheckCircle, MapPin, Pencil, Pin, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  type LayoutChangeEvent,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/** Altura del sheet en PEEK (solo header). */
export const SHEET_PEEK_HEIGHT = 76;
/** Altura máxima del body en MEDIUM antes de scroll (también acotada por viewport). */
export const SHEET_MEDIUM_MAX_BODY = 280;
/** Altura máxima del body en EXPANDED antes de scroll (también acotada por viewport). */
export const SHEET_EXPANDED_MAX_BODY = 420;
/** Mínimo de píxeles de mapa visibles arriba del sheet (para calcular tope desde viewport). */
const MIN_MAP_VISIBLE_TOP = 100;
/** Valores por defecto para overlay cuando no hay medición aún. */
export const SHEET_MEDIUM_HEIGHT = SHEET_PEEK_HEIGHT + 140;
export const SHEET_EXPANDED_HEIGHT = SHEET_PEEK_HEIGHT + 320;

/** @deprecated Usar SHEET_PEEK_HEIGHT. */
export const SHEET_COLLAPSED_HEIGHT = SHEET_PEEK_HEIGHT;
export const SHEET_SUMMARY_HEIGHT = SHEET_MEDIUM_HEIGHT;
export const COLLAPSED_HEIGHT_VISIBLE = SHEET_PEEK_HEIGHT;
export const EXPANDED_HEIGHT_VISIBLE = SHEET_EXPANDED_HEIGHT;
export const MAX_SHEET_HEIGHT = SHEET_EXPANDED_HEIGHT;

const COVER_HEIGHT = 100;
const HEADER_BUTTON_SIZE = 40;
const ACTION_PILL_HEIGHT = 46;
const ACTION_PILL_GAP = 12;
const ACTION_ICON_SIZE = 20;
const BODY_ROW_GAP = 14;

export type SpotSheetSpot = {
  id: string;
  title: string;
  description_short?: string | null;
  description_long?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  saved?: boolean;
  visited?: boolean;
  /** Por qué importa (opcional). */
  why?: string | null;
  /** @deprecated Usar saved/visited. */
  pinStatus?: SpotPinStatus;
};

export type SheetState = 'peek' | 'medium' | 'expanded';

export type SpotSheetProps = {
  spot: SpotSheetSpot | null;
  onClose: () => void;
  onOpenDetail: () => void;
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  onShare?: () => void;
  onSavePin?: () => void;
  onMarkVisited?: () => void;
  userCoords?: { latitude: number; longitude: number } | null;
  isAuthUser?: boolean;
  onDirections?: (spot: SpotSheetSpot) => void;
  onEdit?: (spotId: string) => void;
  /** Se llama cuando la altura del sheet cambia (para offset de controles). */
  onSheetHeightChange?: (height: number) => void;
};

type BodyContentProps = {
  spot: SpotSheetSpot;
  hasDesc: boolean;
  hasCover: boolean;
  isSaved: boolean;
  isVisited: boolean;
  distanceKmVal: number | null;
  whyText: string | null;
  addressText: string | null;
  isAuthUser?: boolean;
  colors: (typeof Colors)['light'];
  colorScheme: 'light' | 'dark' | null;
  onOpenDetail: () => void;
  handleToggleSaved: () => void;
  handleToggleVisited: () => void;
  handleDirections: () => void;
  handleEdit: () => void;
  onEdit?: (spotId: string) => void;
};

/** Solo lo que se muestra en MEDIUM: descripción corta + imagen + Guardar/Visitado. Sin navegación a detalle. */
function MediumBodyContent({
  spot,
  hasDesc,
  hasCover,
  isSaved,
  isVisited,
  colors,
  colorScheme,
  handleToggleSaved,
  handleToggleVisited,
}: Pick<
  BodyContentProps,
  | 'spot'
  | 'hasDesc'
  | 'hasCover'
  | 'isSaved'
  | 'isVisited'
  | 'colors'
  | 'colorScheme'
  | 'handleToggleSaved'
  | 'handleToggleVisited'
>) {
  return (
    <>
      {hasDesc ? (
        <View style={styles.descriptionWrap}>
          <Text
            style={[styles.description, { color: colors.textSecondary }]}
            numberOfLines={3}
          >
            {spot.description_short!.trim()}
          </Text>
        </View>
      ) : null}
      {hasCover ? (
        <View style={styles.imageRow}>
          <View style={styles.imageWrap}>
            <SpotImage
              uri={spot.cover_image_url}
              height={COVER_HEIGHT}
              borderRadius={Radius.md}
              colorScheme={colorScheme ?? undefined}
            />
          </View>
        </View>
      ) : null}
      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.actionPill,
            {
              backgroundColor: isSaved ? colors.stateToVisit : colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              borderWidth: isSaved ? 0 : 1,
            },
          ]}
          onPress={handleToggleSaved}
          accessibilityLabel={isSaved ? 'Guardado' : 'Guardar'}
          accessibilityRole="button"
          accessibilityState={{ selected: isSaved }}
        >
          <Pin size={ACTION_ICON_SIZE} color={isSaved ? '#ffffff' : colors.text} strokeWidth={2} />
          <Text
            style={[styles.actionPillText, { color: isSaved ? '#ffffff' : colors.text }]}
            numberOfLines={1}
          >
            Guardar
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionPill,
            {
              backgroundColor: isVisited ? colors.stateSuccess : colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              borderWidth: isVisited ? 0 : 1,
            },
          ]}
          onPress={handleToggleVisited}
          accessibilityLabel={isVisited ? 'Visitado' : 'Visitado'}
          accessibilityRole="button"
          accessibilityState={{ selected: isVisited }}
        >
          <CheckCircle
            size={ACTION_ICON_SIZE}
            color={isVisited ? '#ffffff' : colors.text}
            strokeWidth={2}
          />
          <Text
            style={[styles.actionPillText, { color: isVisited ? '#ffffff' : colors.text }]}
            numberOfLines={1}
          >
            Visitado
          </Text>
        </Pressable>
      </View>
    </>
  );
}

/** Contenido extra solo en EXPANDED: distancia, Por qué importa, dirección, Cómo llegar, Editar. */
function ExpandedExtra({
  distanceKmVal,
  whyText,
  addressText,
  isAuthUser,
  colors,
  handleDirections,
  handleEdit,
  onEdit,
}: Pick<
  BodyContentProps,
  | 'distanceKmVal'
  | 'whyText'
  | 'addressText'
  | 'isAuthUser'
  | 'colors'
  | 'handleDirections'
  | 'handleEdit'
  | 'onEdit'
>) {
  return (
    <>
      {distanceKmVal != null ? (
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
          A {formatDistanceKm(distanceKmVal)}
        </Text>
      ) : null}
      {whyText ? (
        <View style={styles.detailBlock}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Por qué importa</Text>
          <Text style={[styles.detailBody, { color: colors.textSecondary }]}>{whyText}</Text>
        </View>
      ) : null}
      <View style={styles.detailBlock}>
        <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Dirección</Text>
        <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
          {addressText || 'Sin dirección guardada'}
        </Text>
      </View>
      <Pressable
        style={[styles.detailButton, { backgroundColor: colors.tint }]}
        onPress={handleDirections}
        accessibilityLabel="Cómo llegar"
        accessibilityRole="button"
      >
        <MapPin size={20} color="#fff" strokeWidth={2} />
        <Text style={styles.detailButtonText}>Cómo llegar</Text>
      </Pressable>
      {isAuthUser && onEdit ? (
        <Pressable
          style={[styles.detailButton, { borderColor: colors.borderSubtle, borderWidth: 1 }]}
          onPress={handleEdit}
          accessibilityLabel="Editar spot"
          accessibilityRole="button"
        >
          <Pencil size={20} color={colors.text} strokeWidth={2} />
          <Text style={[styles.detailButtonTextSecondary, { color: colors.text }]}>Editar</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const CONTAINER_PADDING_BOTTOM = 16;

export function SpotSheet({
  spot,
  onClose,
  onOpenDetail,
  state,
  onStateChange,
  onShare,
  onSavePin,
  onMarkVisited,
  userCoords,
  isAuthUser,
  onDirections,
  onEdit,
  onSheetHeightChange,
}: SpotSheetProps) {
  const [headerHeight, setHeaderHeight] = useState(SHEET_PEEK_HEIGHT);
  const [mediumBodyContentHeight, setMediumBodyContentHeight] = useState(0);
  const [fullBodyContentHeight, setFullBodyContentHeight] = useState(0);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);
  const onMediumBodyLayout = useCallback((e: LayoutChangeEvent) => {
    setMediumBodyContentHeight(e.nativeEvent.layout.height);
  }, []);
  const onFullBodyLayout = useCallback((e: LayoutChangeEvent) => {
    setFullBodyContentHeight(e.nativeEvent.layout.height);
  }, []);

  const handleHeaderTap = useCallback(() => {
    if (state === 'peek') onStateChange('medium');
    else if (state === 'medium') onStateChange('expanded');
    else onStateChange('medium');
  }, [state, onStateChange]);

  const colorScheme = useColorScheme();
  const isMedium = state === 'medium';
  const isExpanded = state === 'expanded';
  const bodyContentHeight = isMedium
    ? mediumBodyContentHeight
    : isExpanded
      ? (fullBodyContentHeight || mediumBodyContentHeight)
      : 0;
  const viewportHeight = Dimensions.get('window').height;
  const maxBodyFromViewport = Math.max(
    0,
    viewportHeight - MIN_MAP_VISIBLE_TOP - headerHeight - 12 - CONTAINER_PADDING_BOTTOM
  );
  const maxBodyHeight = isExpanded
    ? maxBodyFromViewport
    : Math.min(SHEET_MEDIUM_MAX_BODY, maxBodyFromViewport);
  const effectiveBodyHeight = Math.min(bodyContentHeight || 0, maxBodyHeight);
  const bodyNeedsScroll = bodyContentHeight > maxBodyHeight;
  const totalSheetHeight =
    spot == null
      ? 0
      : state === 'peek'
        ? SHEET_PEEK_HEIGHT
        : 12 + headerHeight + effectiveBodyHeight + CONTAINER_PADDING_BOTTOM;

  useEffect(() => {
    onSheetHeightChange?.(totalSheetHeight);
  }, [totalSheetHeight, onSheetHeightChange]);

  if (spot == null) return null;

  const colors = Colors[colorScheme ?? 'light'];
  const hasDesc = Boolean(spot.description_short?.trim());
  const hasCover = Boolean(spot.cover_image_url);
  const isSaved = spot.saved ?? spot.pinStatus === 'to_visit';
  const isVisited = spot.visited ?? spot.pinStatus === 'visited';
  const distanceKmVal =
    userCoords != null
      ? distanceKm(userCoords.latitude, userCoords.longitude, spot.latitude, spot.longitude)
      : null;
  const whyText = (spot.why ?? spot.description_long)?.trim() || null;
  const addressText = spot.address?.trim() || null;

  const handleShare = () => {
    if (onShare) onShare();
    else if (__DEV__) console.log('[SpotSheet] Share stub', spot.id);
  };

  const handleToggleSaved = () => {
    if (onSavePin) onSavePin();
  };

  const handleToggleVisited = () => {
    if (onMarkVisited) onMarkVisited();
  };

  const handleDirections = () => {
    if (onDirections) onDirections(spot);
    else Linking.openURL(getMapsDirectionsUrl(spot.latitude, spot.longitude));
  };

  const handleEdit = () => {
    if (onEdit) onEdit(spot.id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          height: totalSheetHeight,
        },
      ]}
    >
      {/* Header: siempre visible cuando spot != null */}
      <View style={styles.headerRow} onLayout={onHeaderLayout}>
        <IconButton
          variant="default"
          size={HEADER_BUTTON_SIZE}
          onPress={handleShare}
          accessibilityLabel="Compartir"
        >
          <Share2 size={20} color={colors.text} strokeWidth={2} />
        </IconButton>
        <Pressable
          style={styles.titleWrap}
          onPress={handleHeaderTap}
          accessibilityLabel={
            state === 'peek' ? 'Expandir' : state === 'medium' ? 'Expandir más' : 'Reducir'
          }
          accessibilityRole="button"
        >
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {spot.title}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.borderSubtle }]}
          onPress={onClose}
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
        >
          <X size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Body MEDIUM: solo descripción + imagen + Guardar/Visitado; altura al contenido; scroll solo si supera max */}
      {isMedium ? (
        bodyNeedsScroll ? (
          <ScrollView
            style={[styles.bodyScroll, { maxHeight: maxBodyHeight }]}
            contentContainerStyle={styles.bodyContentWrap}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.bodyContentInner} onLayout={onMediumBodyLayout}>
              <MediumBodyContent
                spot={spot}
                hasDesc={hasDesc}
                hasCover={hasCover}
                isSaved={isSaved}
                isVisited={isVisited}
                colors={colors}
                colorScheme={colorScheme}
                handleToggleSaved={handleToggleSaved}
                handleToggleVisited={handleToggleVisited}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.bodyContentWrap}>
            <View style={styles.bodyContentInner} onLayout={onMediumBodyLayout}>
              <MediumBodyContent
                spot={spot}
                hasDesc={hasDesc}
                hasCover={hasCover}
                isSaved={isSaved}
                isVisited={isVisited}
                colors={colors}
                colorScheme={colorScheme}
                handleToggleSaved={handleToggleSaved}
                handleToggleVisited={handleToggleVisited}
              />
            </View>
          </View>
        )
      ) : null}

      {/* Body EXPANDED: medium + resto (distancia, Por qué, dirección, Cómo llegar, Editar); altura al contenido; scroll solo si supera max */}
      {isExpanded ? (
        bodyNeedsScroll ? (
          <ScrollView
            style={[styles.bodyScroll, { maxHeight: maxBodyHeight }]}
            contentContainerStyle={styles.bodyContentWrap}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.bodyContentInner} onLayout={onFullBodyLayout}>
              <MediumBodyContent
                spot={spot}
                hasDesc={hasDesc}
                hasCover={hasCover}
                isSaved={isSaved}
                isVisited={isVisited}
                colors={colors}
                colorScheme={colorScheme}
                handleToggleSaved={handleToggleSaved}
                handleToggleVisited={handleToggleVisited}
              />
              <ExpandedExtra
                distanceKmVal={distanceKmVal}
                whyText={whyText}
                addressText={addressText}
                isAuthUser={isAuthUser}
                colors={colors}
                handleDirections={handleDirections}
                handleEdit={handleEdit}
                onEdit={onEdit}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.bodyContentWrap}>
            <View style={styles.bodyContentInner} onLayout={onFullBodyLayout}>
              <MediumBodyContent
                spot={spot}
                hasDesc={hasDesc}
                hasCover={hasCover}
                isSaved={isSaved}
                isVisited={isVisited}
                colors={colors}
                colorScheme={colorScheme}
                handleToggleSaved={handleToggleSaved}
                handleToggleVisited={handleToggleVisited}
              />
              <ExpandedExtra
                distanceKmVal={distanceKmVal}
                whyText={whyText}
                addressText={addressText}
                isAuthUser={isAuthUser}
                colors={colors}
                handleDirections={handleDirections}
                handleEdit={handleEdit}
                onEdit={onEdit}
              />
            </View>
          </View>
        )
      ) : null}
    </View>
  );
}

const HEADER_PADDING_V = 12;
const HEADER_PADDING_H = 14;
const BODY_PADDING_H = 14;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    paddingHorizontal: HEADER_PADDING_H,
    paddingTop: HEADER_PADDING_V,
    paddingBottom: 16,
    zIndex: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContentWrap: {
    paddingHorizontal: BODY_PADDING_H,
    paddingBottom: 16,
    rowGap: BODY_ROW_GAP,
  },
  bodyContentInner: {
    rowGap: BODY_ROW_GAP,
  },
  descriptionWrap: {
    marginBottom: BODY_ROW_GAP,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  imageRow: {
    marginBottom: BODY_ROW_GAP,
  },
  imageWrap: {
    width: '100%',
    height: COVER_HEIGHT,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: ACTION_PILL_GAP,
    width: '100%',
    marginBottom: BODY_ROW_GAP,
  },
  actionPill: {
    flex: 1,
    height: ACTION_PILL_HEIGHT,
    borderRadius: ACTION_PILL_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionPillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailBlock: {
    marginBottom: BODY_ROW_GAP,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  detailButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
});
