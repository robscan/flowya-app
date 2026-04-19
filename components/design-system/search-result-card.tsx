import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SearchListCard } from './search-list-card';

export type SearchResultCardProps = {
  spot: {
    id: string;
    title: string;
    address?: string | null;
    cover_image_url?: string | null;
    pinStatus?: 'default' | 'to_visit' | 'visited';
    description_short?: string | null;
    /** Maki (Mapbox) para icono de categoría cuando no hay cover. OL-URGENT-MAKI-001. */
    linked_maki?: string | null;
    /** OL-EXPLORE-TAGS-001 */
    tagIds?: string[];
  };
  onPress?: () => void;
  /** Señal "cerca": ej. "1.2 km". OL-WOW-F2-002. */
  distanceText?: string | null;
  subtitleOverride?: string | null;
  quickActions?: {
    id: string;
    label: string;
    kind: 'add_image' | 'edit_description' | 'add_tag';
    onPress: () => void;
    busy?: boolean;
    accessibilityLabel?: string;
  }[];
  tagChips?: { id: string; label: string }[];
  onHoverChange?: (hovered: boolean) => void;
};

export function SearchResultCard({
  spot,
  onPress,
  distanceText = null,
  subtitleOverride,
  quickActions = [],
  tagChips,
  onHoverChange,
}: SearchResultCardProps) {
  const resolvedSubtitle =
    subtitleOverride !== undefined ? subtitleOverride : (spot.address ?? null);
  return (
    <View style={styles.wrap}>
      <SearchListCard
        title={spot.title}
        subtitle={resolvedSubtitle}
        imageUri={spot.cover_image_url}
        pinStatus={spot.pinStatus}
        distanceText={distanceText}
        maki={spot.linked_maki ?? undefined}
        quickActions={quickActions}
        tagChips={tagChips}
        onPress={onPress ?? (() => {})}
        accessibilityLabel={`Seleccionar ${spot.title}`}
        onHoverChange={onHoverChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
