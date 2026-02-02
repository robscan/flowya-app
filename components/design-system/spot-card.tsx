/**
 * Design System: SpotCardMapSelection (canónico).
 * Card que aparece al seleccionar un pin en el mapa.
 * Layout: 2 columnas. Izquierda: SpotImage full-height.
 * Derecha: título, descripción.
 * Botones guardar/compartir flotando sobre la imagen (fuera del contenedor, alineados izquierda).
 * Altura definida por el contenido de la columna derecha. Se cierra al tocar fuera.
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
  savePinState?: SavePinState;
  onSavePin?: () => void;
  onShare?: () => void;
  /** Si true, no se muestran botones guardar/compartir (ej. resultados de búsqueda). */
  hideActions?: boolean;
  /** Si se proporciona, el tap en la card llama a onCardPress en lugar de navegar al detalle (ej. SearchResultCard). */
  onCardPress?: () => void;
  /** @deprecated Tap en imagen ahora navega al detalle. */
  onImagePress?: (uri: string) => void;
};

const LEFT_COLUMN_MAX_WIDTH = 128;
const ICON_SIZE = 20;
const ACTIONS_ICON_SIZE = 18;
const ACTIONS_BUTTON_SIZE = 36;
const ICON_ON_STATE = '#ffffff';

export function SpotCardMapSelection({
  spot,
  savePinState = 'default',
  onSavePin,
  onShare,
  hideActions = false,
  onCardPress,
}: SpotCardMapSelectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleOpenDetail = () => {
    if (onCardPress) {
      onCardPress();
      return;
    }
    saveFocusBeforeNavigate();
    blurActiveElement();
    router.push(`/spot/${spot.id}` as const);
  };

  const savePinIconColor =
    savePinState === 'toVisit' || savePinState === 'visited' ? ICON_ON_STATE : colors.background;

  const cardPressLabel = onCardPress
    ? `Seleccionar ${spot.title}`
    : `Ver detalle de ${spot.title}`;
  const cardPressRole = onCardPress ? 'button' : 'link';

  const thumbnailContent = (
    <View style={styles.thumbnailBox}>
      <SpotImage
        uri={spot.cover_image_url}
        width={LEFT_COLUMN_MAX_WIDTH}
        height={undefined}
        borderRadius={0}
        iconSize={24}
        placeholderFillHeight
        colorScheme={colorScheme ?? undefined}
      />
    </View>
  );

  return (
    <View dataSet={{ flowya: 'spot-card-map-selection' }} style={styles.wrapper}>
      {/* Card */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSubtle,
            ...Shadow.card,
          },
        ]}
      >
        {/* Columna izquierda: imagen/placeholder. Tap → detalle o onCardPress. */}
        <View style={styles.leftColumn}>
          <Pressable
            dataSet={{ flowya: 'spot-card-thumbnail' }}
            style={styles.thumbnailWrap}
            onPress={handleOpenDetail}
            accessibilityRole={cardPressRole}
            accessibilityLabel={cardPressLabel}
          >
            {thumbnailContent}
          </Pressable>
        </View>

        {/* Columna derecha: contenido textual */}
        <View style={styles.rightColumn}>
          <Pressable
            style={styles.titleBlock}
            onPress={handleOpenDetail}
            accessibilityRole={cardPressRole}
            accessibilityLabel={cardPressLabel}
          >
            <Text
              dataSet={{ flowya: 'spot-card-title' }}
              style={[styles.title, { color: colors.text }]}
            >
              {spot.title}
            </Text>
          </Pressable>

          {spot.description_short ? (
            <Pressable
              style={styles.descriptionBlock}
              onPress={handleOpenDetail}
              accessibilityRole={cardPressRole}
              accessibilityLabel={cardPressLabel}
            >
              <Text
                dataSet={{ flowya: 'spot-card-description' }}
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {spot.description_short}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Botones flotando fuera de la card, sobre la imagen, alineados izquierda */}
      {!hideActions && (onSavePin || onShare) ? (
        <View
          dataSet={{ flowya: 'spot-card-actions' }}
          style={styles.floatingActions}
          pointerEvents="box-none"
        >
          <View style={styles.actionsStack}>
            {onSavePin ? (
              <IconButton
                dataSet={{ flowya: 'spot-card-save-pin' }}
                variant="savePin"
                savePinState={savePinState}
                size={ACTIONS_BUTTON_SIZE}
                onPress={onSavePin}
                accessibilityLabel="Guardar pin"
              >
                <Pin size={ACTIONS_ICON_SIZE} color={savePinIconColor} strokeWidth={2} />
              </IconButton>
            ) : null}
            {onShare ? (
              <IconButton
                dataSet={{ flowya: 'spot-card-share' }}
                variant="default"
                size={ACTIONS_BUTTON_SIZE}
                onPress={onShare}
                accessibilityLabel="Compartir"
              >
                <Share2 size={ACTIONS_ICON_SIZE} color={colors.text} strokeWidth={2} />
              </IconButton>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Alias para compatibilidad con consumidores existentes. */
export const SpotCard = SpotCardMapSelection;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'stretch',
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    minHeight: 96,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  floatingActions: {
    position: 'absolute',
    top: -44,
    left: 0,
    zIndex: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  leftColumn: {
    position: 'relative',
    alignSelf: 'stretch',
    maxWidth: LEFT_COLUMN_MAX_WIDTH,
    width: LEFT_COLUMN_MAX_WIDTH,
    minHeight: 0,
  },
  actionsStack: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  rightColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: Spacing.base,
  },
  titleBlock: {
    minWidth: 0,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  thumbnailWrap: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
    overflow: 'hidden',
  },
  thumbnailBox: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
    overflow: 'hidden',
  },
  descriptionBlock: {
    minWidth: 0,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
