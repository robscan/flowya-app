import { Image } from 'expo-image';
import { ChevronRight, MapPin } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export type SearchListCardProps = {
  title: string;
  subtitle?: string | null;
  onPress: () => void;
  accessibilityLabel: string;
  imageUri?: string | null;
  showChevron?: boolean;
};

export function SearchListCard({
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  imageUri,
  showChevron = true,
}: SearchListCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasImage = useMemo(
    () => typeof imageUri === 'string' && imageUri.trim().length > 0 && !imageError,
    [imageUri, imageError],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
        <View style={styles.iconWrap}>
          <MapPin size={18} color="#AAB2BF" strokeWidth={2} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? <ChevronRight size={20} color="#AAB2BF" strokeWidth={2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(20,22,28,0.94)',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    minHeight: 88,
  },
  cardPressed: {
    backgroundColor: 'rgba(32,35,45,0.96)',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: '#F4F7FB',
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    color: '#AAB2BF',
    fontSize: 14,
    lineHeight: 20,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
