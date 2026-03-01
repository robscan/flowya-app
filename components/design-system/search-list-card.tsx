import { Image } from 'expo-image';
import { CheckCircle, ChevronRight, ImagePlus, Landmark, MapPin, Pencil, Pin } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  /** Señal "cerca": ej. "A 1.2 km". Discreta, no sobrecarga. */
  distanceText?: string | null;
  /** Señal "landmark": POI destacado. */
  isLandmark?: boolean;
  quickActions?: {
    id: string;
    label: string;
    kind: 'add_image' | 'edit_description';
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
  quickActions = [],
}: SearchListCardProps) {
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
  const hasLeadingMediaBlock = hasImage || addImageAction != null;
  const showPinStatusChip = pinStatus === 'to_visit' || pinStatus === 'visited';
  const statusColor =
    pinStatus === 'visited'
      ? colors.countriesCounterVisitedBackground
      : colors.countriesCounterToVisitBackground;
  const statusForeground = colors.text;
  const statusLabel = pinStatus === 'visited' ? 'Visitado' : 'Por visitar';
  const showRankingSignals = distanceText != null || isLandmark || showPinStatusChip;
  const triggerInlineAction = (action: (() => void) | undefined) => {
    if (!action) return;
    action();
  };

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
      onPress={onPress}
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
          onStartShouldSetResponder={() => true}
          onResponderRelease={(event) => {
            event.stopPropagation?.();
            triggerInlineAction(addImageAction.onPress);
          }}
          accessibilityLabel={addImageAction.accessibilityLabel ?? addImageAction.label}
          accessibilityRole="button"
        >
          <ImagePlus size={18} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>Agregar imagen</Text>
        </View>
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.borderSubtle, borderColor: colors.borderSubtle }]}>
          <MapPin size={18} color={colors.textSecondary} strokeWidth={2} />
        </View>
      )}
      <View style={[styles.content, hasLeadingMediaBlock ? styles.contentWithMedia : null]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : editDescriptionAction ? (
          <View
            style={styles.descriptionCtaRow}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(event) => {
              event.stopPropagation?.();
              triggerInlineAction(editDescriptionAction.onPress);
            }}
            accessibilityLabel={editDescriptionAction.accessibilityLabel ?? editDescriptionAction.label}
            accessibilityRole="button"
          >
            <Pencil size={12} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.descriptionCtaText, { color: colors.primary }]}>
              Agregar una descripción corta.
            </Text>
          </View>
        ) : null}
        {showRankingSignals ? (
          <View style={styles.rankingSignals}>
            {distanceText != null ? (
              <Text style={[styles.rankingSignal, { color: colors.textSecondary }]}>
                A {distanceText}
              </Text>
            ) : null}
            {showPinStatusChip ? (
              <View
                style={[styles.rankingChip, { backgroundColor: statusColor }]}
                accessibilityLabel={statusLabel}
                accessibilityRole="image"
              >
                {pinStatus === 'visited' ? (
                  <CheckCircle size={12} color={statusForeground} strokeWidth={2.2} />
                ) : (
                  <Pin size={12} color={statusForeground} strokeWidth={2} />
                )}
                <Text style={[styles.rankingChipLabel, { color: statusForeground }]}>
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
          </View>
        ) : null}
      </View>
      {showChevron ? (
        <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} style={styles.chevron} />
      ) : null}
    </Pressable>
  );
}

/** Alias canónico DS para migración progresiva sin ruptura. */
export const ResultRow = SearchListCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
  },
  contentWithMedia: {
    justifyContent: 'flex-start',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    paddingRight: Spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  imageWrap: {
    width: 88,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  imagePlaceholderWrap: {
    width: 88,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderStyle: 'dashed',
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
  },
  descriptionCtaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  rankingSignals: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  rankingSignal: {
    fontSize: 12,
    lineHeight: 16,
  },
  rankingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  rankingChipLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  chevron: {
    alignSelf: 'center',
  },
});
