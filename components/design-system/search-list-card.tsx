import { Image } from 'expo-image';
import { CheckCircle, CheckCircle2, ChevronRight, Circle, ImagePlus, Landmark, Pencil, Pin, Tag } from 'lucide-react-native';

import { AddImageCta } from "@/components/design-system/add-image-cta";
import { getMakiLucideIcon } from '@/lib/maki-icon-mapping';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ExploreListDensity } from '@/lib/storage/exploreListDensityPreference';

/**
 * Fila de resultado de búsqueda (mapa / listados).
 *
 * **Layout en columnas (2026-04):** `[media | columnaTexto]`. El chevron no es una tercera columna del card.
 *
 * 1. **Fila título:** `title` + `ChevronRight` (misma fila; el título usa `flex:1` + `minWidth:0` para envolver sin robar ancho a las filas inferiores).
 * 2. **Fila contenido:** `subtitle` o CTA de nota (`edit_description`).
 * 3. **Fila meta:** distancia, chip de estado pin, landmark, chips de etiqueta (icono Tag), Etiquetar — `rankingChipsCluster` con `flexWrap` para usar el ancho completo de la columna de texto.
 *
 * Media: imagen al borde izquierdo, placeholder «Agregar imagen», o icono maki. Ver contrato en `docs/contracts/DESIGN_SYSTEM_USAGE.md` §6.2.
 */
export type SearchListCardProps = {
  title: string;
  subtitle?: string | null;
  onPress: () => void;
  accessibilityLabel: string;
  imageUri?: string | null;
  showChevron?: boolean;
  pinStatus?: 'default' | 'to_visit' | 'visited';
  selected?: boolean;
  disabled?: boolean;
  /**
   * Señal "cerca" (ej. "1,2 km" sin prefijo; el UI añade "A ").
   * Canon: con ubicación de usuario va en la **misma franja** que chips de estado, etiquetas y Etiquetar
   * (un solo cluster inline), no en una línea aparte.
   */
  distanceText?: string | null;
  /** Señal "landmark": POI destacado. */
  isLandmark?: boolean;
  /** Maki id (Mapbox) para icono de categoría (park, museum, etc.). Fallback: MapPin. */
  maki?: string | null;
  /** OL-EXPLORE-TAGS-001: chips de etiquetas en resultados (todas las que tenga el spot). */
  tagChips?: { id: string; label: string }[];
  quickActions?: {
    id: string;
    label: string;
    kind: 'add_image' | 'edit_description' | 'add_tag';
    onPress: () => void;
    busy?: boolean;
    accessibilityLabel?: string;
  }[];
  /** Web: hover en la fila (p. ej. sincronizar pin del mapa en desktop). */
  onHoverChange?: (hovered: boolean) => void;
  /** Modo selección múltiple: el card actúa como checkbox y reemplaza el chevron por indicador. */
  selectionMode?: boolean;
  /** Densidad visual: misma card canónica, distinto nivel de detalle. */
  density?: ExploreListDensity;
  /** Contexto visual del listado. No filtra ni cambia contenido; solo tiñe superficie/borde. */
  listContext?: 'all' | 'to_visit' | 'visited';
};
/** Alias canónico DS para item visual de listados. */
export type ResultRowProps = SearchListCardProps;

export function SearchListCard({
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  imageUri,
  showChevron = true,
  pinStatus = 'default',
  selected = false,
  disabled = false,
  distanceText = null,
  isLandmark = false,
  maki = null,
  tagChips = [],
  quickActions = [],
  onHoverChange,
  selectionMode = false,
  density = 'detail',
  listContext = 'all',
}: SearchListCardProps) {
  const INLINE_ACTION_SUPPRESS_MS = 650;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [imageError, setImageError] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasImage = useMemo(
    () => typeof imageUri === 'string' && imageUri.trim().length > 0 && !imageError,
    [imageUri, imageError],
  );
  const addImageAction = quickActions.find((action) => action.kind === 'add_image');
  const editDescriptionAction = quickActions.find((action) => action.kind === 'edit_description');
  const addTagAction = quickActions.find((action) => action.kind === 'add_tag');
  const isDetailDensity = density === 'detail';
  const isCompactDensity = density === 'compact';
  const isSimpleDensity = density === 'simple';
  const showAddImageCta = isDetailDensity && addImageAction != null;
  const hasLeadingMediaBlock = hasImage || showAddImageCta;
  const isSimpleWithoutMedia = isSimpleDensity && !hasLeadingMediaBlock;
  const showVisitedAddImageLead =
    !selectionMode && !isDetailDensity && !hasImage && addImageAction != null && listContext === 'visited';
  const contextSurface =
    listContext === 'to_visit'
      ? {
          background: colors.countriesPanelToVisitBackgroundElevated,
          border: colors.countriesPanelToVisitBorder,
          subtle: colors.countriesPanelToVisitBorderSubtle,
        }
      : listContext === 'visited'
        ? {
            background: colors.countriesPanelVisitedBackgroundElevated,
            border: colors.countriesPanelVisitedBorder,
            subtle: colors.countriesPanelVisitedBorderSubtle,
          }
        : {
            background: colors.backgroundElevated,
            border: colors.borderSubtle,
            subtle: colors.borderSubtle,
          };
  const showPinStatusChip = pinStatus === 'to_visit' || pinStatus === 'visited';
  const showTagChips = !isSimpleDensity && tagChips.length > 0;
  const suppressCardPressUntilRef = useRef(0);
  /** Chip de estado pin: muy tenue (solo borde teñido + texto secundario). */
  const pinStatusMuted =
    pinStatus === 'visited'
      ? {
          bg: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: colorScheme === 'dark' ? 'rgba(48,209,88,0.12)' : 'rgba(52,199,89,0.14)',
          fg: colors.textSecondary,
        }
      : {
          bg: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: colorScheme === 'dark' ? 'rgba(255,159,10,0.12)' : 'rgba(230,134,43,0.14)',
          fg: colors.textSecondary,
        };
  const statusLabel = pinStatus === 'visited' ? 'Visitado' : 'Por visitar';
  const showRankingSignals =
    (!isCompactDensity && !isSimpleDensity && distanceText != null) ||
    (!isCompactDensity && !isSimpleDensity && isLandmark) ||
    (!isSimpleDensity && showPinStatusChip) ||
    showTagChips ||
    (!isSimpleDensity && addTagAction != null);
  const markInlineActionIntent = () => {
    suppressCardPressUntilRef.current = Date.now() + INLINE_ACTION_SUPPRESS_MS;
  };
  const handleCardPress = () => {
    if (Date.now() < suppressCardPressUntilRef.current) {
      return;
    }
    onPress();
  };
  const triggerInlineAction = (action: (() => void) | undefined) => {
    if (!action) return;
    markInlineActionIntent();
    action();
  };
  const handleVisitedAddImageLeadPress = () => {
    if (disabled || !showVisitedAddImageLead || addImageAction?.busy) return;
    triggerInlineAction(addImageAction?.onPress);
  };
  const trailingAffordance = selectionMode ? (
    <View style={[styles.trailingSlot, isSimpleDensity ? styles.trailingSlotSimple : null]}>
      {selected ? (
        <CheckCircle2
          size={20}
          color={colors.primary}
          strokeWidth={2.2}
        />
      ) : (
        <Circle
          size={20}
          color={colors.textSecondary}
          strokeWidth={2}
        />
      )}
    </View>
  ) : showChevron ? (
    <View style={[styles.trailingSlot, isSimpleDensity ? styles.trailingSlotSimple : null]}>
      <ChevronRight
        size={20}
        color={colors.textSecondary}
        strokeWidth={2}
      />
    </View>
  ) : null;
  const webInlineActionStopProps =
    Platform.OS === 'web'
      ? ({
          onClickCapture: (event: any) => {
            event?.stopPropagation?.();
            markInlineActionIntent();
          },
          onPointerDownCapture: (event: any) => {
            event?.stopPropagation?.();
            markInlineActionIntent();
          },
        } as any)
      : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isCompactDensity ? styles.cardCompact : null,
        isSimpleDensity ? styles.cardSimple : null,
        hasLeadingMediaBlock ? styles.cardWithImage : null,
        hasLeadingMediaBlock && isCompactDensity ? styles.cardWithImageCompact : null,
        hasLeadingMediaBlock && isSimpleDensity ? styles.cardWithImageSimple : null,
        {
          borderColor: selected ? colors.primary : contextSurface.border,
          backgroundColor: selected
            ? colors.stateSurfaceHover
            : pressed && !disabled
              ? colors.stateSurfacePressed
              : hovered && Platform.OS === 'web'
                ? colors.stateSurfaceHover
                : contextSurface.background,
          opacity: disabled ? 0.55 : 1,
        },
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
      ]}
      onPress={handleCardPress}
      onHoverIn={() => {
        setHovered(true);
        onHoverChange?.(true);
      }}
      onHoverOut={() => {
        setHovered(false);
        onHoverChange?.(false);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={selectionMode ? "checkbox" : "button"}
      accessibilityState={selectionMode ? { checked: selected, disabled } : { selected, disabled }}
    >
      {hasImage ? (
        <View
          style={[
            styles.imageWrap,
            isCompactDensity ? styles.imageWrapCompact : null,
            isSimpleDensity ? styles.imageWrapSimple : null,
          ]}
        >
          <Image
            source={{ uri: imageUri! }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        </View>
      ) : showAddImageCta ? (
        <View
          style={[
            styles.imagePlaceholderWrap,
            {
              borderColor: contextSurface.subtle,
              backgroundColor: colors.background,
            },
          ]}
          {...webInlineActionStopProps}
          onStartShouldSetResponder={() => true}
          onStartShouldSetResponderCapture={() => {
            markInlineActionIntent();
            return true;
          }}
          onResponderRelease={(event) => {
            event.stopPropagation?.();
            if (!addImageAction.busy) triggerInlineAction(addImageAction.onPress);
          }}
          accessible={false}
        >
          <AddImageCta
            onPress={addImageAction.onPress}
            busy={Boolean(addImageAction.busy)}
            disabled={disabled}
            size="media"
            interactive={false}
            borderColor="transparent"
            backgroundColor="transparent"
            accessibilityLabel={addImageAction.accessibilityLabel ?? "Subir mis fotos"}
            label="Subir mis fotos"
          />
        </View>
      ) : (
        <View
          style={[
            styles.iconWrap,
            isCompactDensity ? styles.iconWrapCompact : null,
            isSimpleDensity ? styles.iconWrapSimple : null,
            showVisitedAddImageLead && Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : null,
            {
              backgroundColor: showVisitedAddImageLead ? colors.background : contextSurface.subtle,
              borderColor: showVisitedAddImageLead ? contextSurface.border : contextSurface.subtle,
            },
          ]}
          {...(showVisitedAddImageLead ? webInlineActionStopProps : null)}
          {...(showVisitedAddImageLead && Platform.OS === 'web'
            ? ({
                onClick: (e: unknown) => {
                  (e as { stopPropagation?: () => void })?.stopPropagation?.();
                  handleVisitedAddImageLeadPress();
                },
              } as const)
            : showVisitedAddImageLead
              ? {
                  onStartShouldSetResponder: () => true,
                  onStartShouldSetResponderCapture: () => {
                    markInlineActionIntent();
                    return true;
                  },
                  onResponderRelease: (event: { stopPropagation?: () => void }) => {
                    event.stopPropagation?.();
                    handleVisitedAddImageLeadPress();
                  },
                }
              : null)}
          accessible={showVisitedAddImageLead ? true : undefined}
          accessibilityRole={showVisitedAddImageLead ? "button" : undefined}
          accessibilityLabel={
            showVisitedAddImageLead
              ? addImageAction?.accessibilityLabel ?? `Subir mis fotos a ${title}`
              : undefined
          }
          accessibilityState={showVisitedAddImageLead ? { disabled: disabled || Boolean(addImageAction?.busy) } : undefined}
        >
          {(() => {
            const IconComponent = showVisitedAddImageLead ? ImagePlus : getMakiLucideIcon(maki ?? null);
            return (
              <IconComponent
                size={isSimpleDensity ? 16 : 18}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            );
          })()}
        </View>
      )}
      <View
        style={[
          styles.content,
          hasLeadingMediaBlock ? styles.contentWithMedia : null,
          isCompactDensity ? styles.contentCompact : null,
          isSimpleDensity ? styles.contentSimple : null,
          isSimpleWithoutMedia ? styles.contentSimpleWithoutMedia : null,
          hasLeadingMediaBlock && isCompactDensity ? styles.contentWithMediaCompact : null,
          hasLeadingMediaBlock && isSimpleDensity ? styles.contentWithMediaSimple : null,
        ]}
      >
        <View
          style={[
            styles.titleRow,
            !isDetailDensity ? styles.titleRowDense : null,
            isSimpleDensity ? styles.titleRowSimple : null,
          ]}
        >
          <Text
            style={[
              styles.title,
              styles.titleInRow,
              isSimpleDensity ? styles.titleSimple : null,
              { color: colors.text },
            ]}
            numberOfLines={isDetailDensity ? 2 : 1}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {title}
          </Text>
          {trailingAffordance}
        </View>
        {isDetailDensity && subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {subtitle}
          </Text>
        ) : isDetailDensity && editDescriptionAction ? (
          <View
            style={styles.descriptionCtaRow}
            {...webInlineActionStopProps}
            onStartShouldSetResponder={() => true}
            onStartShouldSetResponderCapture={() => {
              markInlineActionIntent();
              return true;
            }}
            onResponderRelease={(event) => {
              event.stopPropagation?.();
              triggerInlineAction(editDescriptionAction.onPress);
            }}
            accessible={false}
          >
            <Pencil size={12} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.descriptionCtaText, { color: colors.primary }]}>
              Escribe una nota personal breve.
            </Text>
          </View>
        ) : null}
        {showRankingSignals ? (
          <View style={[styles.rankingChipsCluster, isCompactDensity ? styles.rankingChipsClusterCompact : null]}>
            {!isCompactDensity && !isSimpleDensity && distanceText != null ? (
              <Text
                style={[styles.rankingSignal, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                A {distanceText}
              </Text>
            ) : null}
            {showPinStatusChip ? (
              <View
                style={[
                  styles.rankingChip,
                  styles.pinStatusChipQuiet,
                  {
                    backgroundColor: pinStatusMuted.bg,
                    borderColor: pinStatusMuted.border,
                  },
                ]}
                accessibilityLabel={statusLabel}
                accessibilityRole="image"
              >
                {pinStatus === 'visited' ? (
                  <CheckCircle size={12} color={pinStatusMuted.fg} strokeWidth={2.2} />
                ) : (
                  <Pin size={12} color={pinStatusMuted.fg} strokeWidth={2} />
                )}
                <Text style={[styles.rankingChipLabel, { color: pinStatusMuted.fg }]}>
                  {statusLabel as string}
                </Text>
              </View>
            ) : null}
            {!isCompactDensity && !isSimpleDensity && isLandmark ? (
              <View style={[styles.rankingChip, { backgroundColor: contextSurface.subtle }]}>
                <Landmark size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.rankingChipLabel, { color: colors.textSecondary }]}>Lugar destacado</Text>
              </View>
            ) : null}
            {showTagChips
              ? tagChips.map((chip) => (
                  <View
                    key={chip.id}
                    style={[styles.rankingChip, { backgroundColor: contextSurface.subtle }]}
                    accessibilityLabel={chip.label}
                    accessibilityRole="text"
                  >
                    <Tag size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={[styles.rankingChipLabel, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {chip.label}
                    </Text>
                  </View>
                ))
              : null}
            {!isSimpleDensity && addTagAction ? (
              <View
                collapsable={false}
                style={[
                  styles.etiquetarBesideChips,
                  isCompactDensity ? styles.etiquetarBesideChipsCompact : null,
                  Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as const) : null,
                ]}
                {...webInlineActionStopProps}
                {...(Platform.OS === 'web'
                  ? ({
                      onClick: (e: unknown) => {
                        (e as { stopPropagation?: () => void })?.stopPropagation?.();
                        triggerInlineAction(addTagAction.onPress);
                      },
                      accessibilityLabel: addTagAction.accessibilityLabel ?? addTagAction.label,
                    } as const)
                  : {
                      onStartShouldSetResponder: () => true,
                      onStartShouldSetResponderCapture: () => {
                        markInlineActionIntent();
                        return true;
                      },
                      onResponderRelease: (event: { stopPropagation?: () => void }) => {
                        event.stopPropagation?.();
                        triggerInlineAction(addTagAction.onPress);
                      },
                    })}
                accessible={false}
              >
                <Tag size={13} color={colors.primary} strokeWidth={2.2} />
                <Text style={[styles.etiquetarLabel, { color: colors.primary }]}>{addTagAction.label}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Alias canónico DS para migración progresiva sin ruptura. */
export const ResultRow = SearchListCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    /** Icono/imagen a la izquierda; columna de texto: fila título+chevron, contenido y meta a ancho completo. */
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    minHeight: 88,
    overflow: 'hidden',
  },
  cardCompact: {
    minHeight: 72,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  cardSimple: {
    minHeight: 48,
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 10,
    alignItems: 'center',
  },
  cardWithImage: {
    alignItems: 'stretch',
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    gap: Spacing.base,
  },
  cardWithImageCompact: {
    gap: Spacing.sm,
  },
  cardWithImageSimple: {
    alignItems: 'center',
    gap: 10,
    paddingLeft: 6,
    paddingTop: 4,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'flex-start',
  },
  contentCompact: {
    gap: 2,
  },
  contentSimple: {
    gap: 0,
    justifyContent: 'center',
  },
  contentSimpleWithoutMedia: {
    minHeight: 36,
  },
  contentWithMedia: {
    justifyContent: 'flex-start',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  contentWithMediaCompact: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    justifyContent: 'center',
  },
  contentWithMediaSimple: {
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    width: '100%',
    minWidth: 0,
  },
  titleRowDense: {
    alignItems: 'center',
  },
  titleRowSimple: {
    minHeight: 36,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  titleSimple: {
    fontSize: 14,
    lineHeight: 18,
  },
  /** Ocupa el espacio entre media y chevron; permite wrap del título sin reservar columna vacía abajo. */
  titleInRow: {
    flex: 1,
    minWidth: 0,
  },
  trailingSlot: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingSlotSimple: {
    width: 28,
    height: 36,
  },
  subtitle: {
    fontSize: 13,
    /** Interlineado ajustado: 18px dejaba mucho aire entre líneas al partir el subtítulo. */
    lineHeight: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  iconWrapCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignSelf: 'center',
    marginTop: 0,
  },
  iconWrapSimple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 0,
  },
  imageWrap: {
    width: 88,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  imageWrapCompact: {
    width: 64,
    alignSelf: 'stretch',
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
  },
  imageWrapSimple: {
    width: 32,
    height: 32,
    alignSelf: 'center',
    borderRadius: 16,
  },
  imagePlaceholderWrap: {
    width: 88,
    alignSelf: 'stretch',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  descriptionCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginLeft: -6,
    borderRadius: 8,
  },
  descriptionCtaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  /** Distancia + pin + landmark + etiquetas + Etiquetar; `flexWrap` evita recortes en anchos estrechos. */
  rankingChipsCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'flex-start',
    marginTop: 4,
    rowGap: Spacing.xs,
    columnGap: Spacing.sm,
    width: '100%',
    minWidth: 0,
  },
  rankingChipsClusterCompact: {
    marginTop: 2,
    rowGap: 4,
    columnGap: Spacing.xs,
  },
  /** Puede acortarse con puntos si hace falta espacio para el cluster. */
  rankingSignal: {
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
    minWidth: 0,
  },
  rankingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    flexShrink: 0,
    maxWidth: '100%',
  },
  pinStatusChipQuiet: {
    borderWidth: 1,
  },
  etiquetarBesideChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginLeft: -2,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  etiquetarBesideChipsCompact: {
    minHeight: 28,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  etiquetarLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  rankingChipLabel: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
});
