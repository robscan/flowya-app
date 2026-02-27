import { Image } from 'expo-image';
import { CheckCircle, ChevronRight, MapPin, Pin } from 'lucide-react-native';
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
  const showStatusBadge = pinStatus === 'to_visit' || pinStatus === 'visited';
  const statusColor = pinStatus === 'visited' ? colors.stateSuccess : colors.stateToVisit;
  const statusLabel = pinStatus === 'visited' ? 'Visitado' : 'Por visitar';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
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
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.borderSubtle, borderColor: colors.borderSubtle }]}>
          <MapPin size={18} color={colors.textSecondary} strokeWidth={2} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showStatusBadge ? (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusColor,
              borderColor: statusColor,
            },
          ]}
          accessibilityLabel={statusLabel}
          accessibilityRole="image"
        >
          {pinStatus === 'visited' ? (
            <CheckCircle size={14} color="#FFFFFF" strokeWidth={2.2} />
          ) : (
            <Pin size={14} color="#FFFFFF" strokeWidth={2.2} />
          )}
        </View>
      ) : null}
      {showChevron ? <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} /> : null}
    </Pressable>
  );
}

/** Alias canónico DS para migración progresiva sin ruptura. */
export const ResultRow = SearchListCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    minHeight: 88,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
    height: 88,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 2,
  },
});
