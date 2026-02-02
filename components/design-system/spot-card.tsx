/**
 * Design System: SpotCardMapSelection (canónico).
 * Card que aparece al seleccionar un pin en el mapa.
 * Layout: Fila 1 = título | acciones. Fila 2 = descripción | miniatura 72×40 (derecha, debajo de botones).
 * Texto sin truncar; altura auto. Se cierra al tocar fuera; sin botón cerrar.
 */

import { useRouter } from 'expo-router';
import { Pin, Share2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blurActiveElement, saveFocusBeforeNavigate } from '@/lib/focus-management';

import type { SavePinState } from './icon-button';
import { IconButton } from './icon-button';
import { SpotImage } from './spot-image';

export type SpotCardSpot = {
  id: string;
  title: string;
  description_short?: string | null;
  cover_image_url?: string | null;
};

type SpotCardMapSelectionProps = {
  spot: SpotCardSpot;
  /** Estado visual del botón Guardar pin: default (no guardado), toVisit, visited. */
  savePinState?: SavePinState;
  onSavePin?: () => void;
  onShare?: () => void;
  /** Al tocar la imagen de portada (abrir en grande). */
  onImagePress?: (uri: string) => void;
};

const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 40;
const ICON_SIZE = 20;
/** Dos IconButtons 44px + gap. */
const ACTIONS_WIDTH = 44 * 2 + Spacing.xs;

const ICON_ON_STATE = '#ffffff';

export function SpotCardMapSelection({
  spot,
  savePinState = 'default',
  onSavePin,
  onShare,
  onImagePress,
}: SpotCardMapSelectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleOpenDetail = () => {
    saveFocusBeforeNavigate();
    blurActiveElement();
    router.push(`/spot/${spot.id}` as const);
  };

  const savePinIconColor =
    savePinState === 'toVisit' || savePinState === 'visited' ? ICON_ON_STATE : colors.text;

  return (
    <View
      dataSet={{ flowya: 'spot-card-map-selection' }}
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderSubtle,
          ...Shadow.card,
        },
      ]}
    >
      {/* Fila 1: Título (izq) | Acciones (der) */}
      <View style={styles.row1}>
        <Pressable
          style={styles.titleBlock}
          onPress={handleOpenDetail}
          accessibilityRole="link"
          accessibilityLabel={`Ver detalle de ${spot.title}`}
        >
          <Text
            dataSet={{ flowya: 'spot-card-title' }}
            style={[styles.title, { color: colors.text }]}
          >
            {spot.title}
          </Text>
        </Pressable>
        <View style={[styles.actions, { pointerEvents: 'box-none' }]}>
          {onSavePin ? (
            <IconButton
              dataSet={{ flowya: 'spot-card-save-pin' }}
              variant="savePin"
              savePinState={savePinState}
              onPress={onSavePin}
              accessibilityLabel="Guardar pin"
            >
              <Pin size={ICON_SIZE} color={savePinIconColor} strokeWidth={2} />
            </IconButton>
          ) : null}
          {onShare ? (
            <IconButton
              dataSet={{ flowya: 'spot-card-share' }}
              variant="default"
              onPress={onShare}
              accessibilityLabel="Compartir"
            >
              <Share2 size={ICON_SIZE} color={colors.text} strokeWidth={2} />
            </IconButton>
          ) : null}
        </View>
      </View>

      {/* Fila 2: Descripción (izq) | Miniatura a la derecha, debajo de los botones (der) */}
      <View style={styles.row2}>
        <Pressable
          style={styles.descriptionBlock}
          onPress={handleOpenDetail}
          accessibilityRole="link"
          accessibilityLabel={`Ver detalle de ${spot.title}`}
        >
          {spot.description_short ? (
            <Text
              dataSet={{ flowya: 'spot-card-description' }}
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {spot.description_short}
            </Text>
          ) : null}
        </Pressable>
        {spot.cover_image_url && onImagePress ? (
          <View dataSet={{ flowya: 'spot-card-thumbnail' }} style={styles.thumbnailWrap}>
            <View style={styles.thumbnailBox}>
              <SpotImage
                uri={spot.cover_image_url}
                width={THUMB_WIDTH}
                height={THUMB_HEIGHT}
                borderRadius={Radius.md}
                iconSize={16}
                onPress={() => onImagePress(spot.cover_image_url!)}
                colorScheme={colorScheme ?? undefined}
              />
            </View>
          </View>
        ) : (
          <Pressable
            dataSet={{ flowya: 'spot-card-thumbnail' }}
            style={styles.thumbnailWrap}
            onPress={handleOpenDetail}
            accessibilityRole="link"
            accessibilityLabel={`Ver detalle de ${spot.title}`}
          >
            <View style={styles.thumbnailBox}>
              <SpotImage
                uri={spot.cover_image_url}
                width={THUMB_WIDTH}
                height={THUMB_HEIGHT}
                borderRadius={Radius.md}
                iconSize={16}
                colorScheme={colorScheme ?? undefined}
              />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Alias para compatibilidad con consumidores existentes. */
export const SpotCard = SpotCardMapSelection;

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  actions: {
    width: ACTIONS_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  thumbnailWrap: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  /** Caja fija 72×40 para que el contenido (imagen o placeholder) tenga altura real en web. */
  thumbnailBox: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    minHeight: THUMB_HEIGHT,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: Radius.md,
  },
  descriptionBlock: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
