import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { SearchListCard } from './search-list-card';

export type SearchResultCardProps = {
  spot: {
    id: string;
    title: string;
    address?: string | null;
    cover_image_url?: string | null;
    pinStatus?: 'default' | 'to_visit' | 'visited';
  };
  onPress?: () => void;
};

export function SearchResultCard({
  spot,
  onPress,
}: SearchResultCardProps) {
  return (
    <View style={styles.wrap}>
      <SearchListCard
        title={spot.title}
        subtitle={spot.address ?? null}
        imageUri={spot.cover_image_url}
        pinStatus={spot.pinStatus}
        onPress={onPress ?? (() => {})}
        accessibilityLabel={`Seleccionar ${spot.title}`}
      />
    </View>
  );
}

const MOCK_SPOTS: SearchResultCardProps['spot'][] = [
  {
    id: 'mock-1',
    title: 'Café del centro',
    address: 'Avenida 10, Playa del Carmen, México',
    cover_image_url: null,
  },
  {
    id: 'mock-2',
    title: 'Playa Norte',
    address: 'Isla Mujeres, Quintana Roo, México',
    cover_image_url: null,
  },
  {
    id: 'mock-3',
    title: 'Mirador del atardecer',
    address: 'Carretera Costera, Tulum, México',
    cover_image_url: null,
  },
];

/** Showcase para Design System: listado de SearchResultCard (resultados de búsqueda). */
export function SearchResultsShowcase() {
  return (
    <View style={styles.showcase}>
      {MOCK_SPOTS.map((spot) => (
        <SearchResultCard
          key={spot.id}
          spot={spot}
          onPress={() => {}}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  showcase: {
    gap: Spacing.sm,
    width: '100%',
  },
});
