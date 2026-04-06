import { Image } from 'expo-image';
import { CheckCircle, ChevronRight, Hash, ImagePlus, Landmark, Pencil, Pin } from 'lucide-react-native';

import { getMakiLucideIcon } from '@/lib/maki-icon-mapping';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Fila de resultado de búsqueda (mapa / listados).
 *
 * **Layout en columnas (2026-04):** `[media | columnaTexto]`. El chevron no es una tercera columna del card.
 *
 * 1. **Fila título:** `title` + `ChevronRight` (misma fila; el título usa `flex:1` + `minWidth:0` para envolver sin robar ancho a las filas inferiores).
 * 2. **Fila contenido:** `subtitle` o CTA de nota (`edit_description`).
 * 3. **Fila meta:** distancia, chip de estado pin, landmark, `#tags`, Etiquetar — `rankingChipsCluster` con `flexWrap` para usar el ancho completo de la columna de texto.
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
   * Canon: con ubicación de usuario va en la **misma franja** que chips de estado, #etiquetas y Etiquetar
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
    accessibilityLabel?: string;
  }[];
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
  const hasLeadingMediaBlock = hasImage || addImageAction != null;
  const showPinStatusChip = pinStatus === 'to_visit' || pinStatus === 'visited';
  const showTagChips = tagChips.length > 0;
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
    distanceText != null ||
    isLandmark ||
    showPinStatusChip ||
    showTagChips ||
    addTagAction != null;
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
        hasLeadingMediaBlock ? styles.cardWithImage : null,
        {
          borderColor: selected ? colors.primary : colors.borderSubtle,
          backgroundColor: selected
            ? colors.stateSurfaceHover
            : pressed && !disabled
              ? colors.stateSurfacePressed
              : hovered && Platform.OS === 'web'
                ? colors.stateSurfaceHover
                : colors.backgroundElevated,
          opacity: disabled ? 0.55 : 1,
        },
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
      ]}
      onPress={handleCardPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
    >
      {hasImage ? (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUri! }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        </View>
      ) : addImageAction ? (
        <View
          style={[
            styles.imagePlaceholderWrap,
            {
              borderColor: colors.borderSubtle,
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
            triggerInlineAction(addImageAction.onPress);
          }}
          accessible={false}
        >
          <ImagePlus size={18} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>Agregar imagen</Text>
        </View>
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.borderSubtle, borderColor: colors.borderSubtle }]}>
          {(() => {
            const IconComponent = getMakiLucideIcon(maki ?? null);
            return <IconComponent size={18} color={colors.textSecondary} strokeWidth={2} />;
          })()}
        </View>
      )}
      <View style={[styles.content, hasLeadingMediaBlock ? styles.contentWithMedia : null]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, styles.titleInRow, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {showChevron ? (
            <ChevronRight
              size={20}
              color={colors.textSecondary}
              strokeWidth={2}
              style={styles.chevronInTitleRow}
            />
          ) : null}
        </View>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {subtitle}
          </Text>
        ) : editDescriptionAction ? (
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
          <View style={styles.rankingChipsCluster}>
              {distanceText != null ? (
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
                {isLandmark ? (
                  <View style={[styles.rankingChip, { backgroundColor: colors.borderSubtle }]}>
                    <Landmark size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.rankingChipLabel, { color: colors.textSecondary }]}>Lugar destacado</Text>
                  </View>
                ) : null}
                {showTagChips
                  ? tagChips.map((chip) => (
                      <View
                        key={chip.id}
                        style={[styles.rankingChip, { backgroundColor: colors.borderSubtle }]}
                        accessibilityLabel={chip.label}
                        accessibilityRole="text"
                      >
                        <Text style={[styles.rankingChipLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                          #{chip.label}
                        </Text>
                      </View>
                    ))
                  : null}
                {addTagAction ? (
                  <View
                    collapsable={false}
                    style={[
                      styles.etiquetarBesideChips,
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
                    <Hash size={13} color={colors.primary} strokeWidth={2.2} />
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
  cardWithImage: {
    alignItems: 'stretch',
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    gap: Spacing.base,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'flex-start',
  },
  contentWithMedia: {
    justifyContent: 'flex-start',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    width: '100%',
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  /** Ocupa el espacio entre media y chevron; permite wrap del título sin reservar columna vacía abajo. */
  titleInRow: {
    flex: 1,
    minWidth: 0,
  },
  chevronInTitleRow: {
    flexShrink: 0,
    marginTop: 2,
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
  imageWrap: {
    width: 88,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  imagePlaceholderWrap: {
    width: 88,
    alignSelf: 'stretch',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  imagePlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    textAlign: 'center',
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
  /** Distancia + pin + landmark + #tags + Etiquetar (misma franja que SpotSheetMetaRow). */
  rankingChipsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: Spacing.sm,
    flexShrink: 0,
    alignContent: 'flex-start',
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
    alignSelf: 'flex-start',
  },
  etiquetarLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  rankingChipLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
