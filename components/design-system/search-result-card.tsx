/**
 * Design System: SearchResultCard.
 * Card usada en el listado de resultados de búsqueda del mapa.
 * Visualmente igual a SpotCardMapSelection pero sin botones guardar/compartir.
 * Al tocar se notifica onPress (ej. seleccionar resultado y centrar pin en el mapa).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import type { SavePinState } from './icon-button';
import type { SpotCardSpot } from './spot-card';
import { SpotCardMapSelection } from './spot-card';

export type SearchResultCardProps = {
  spot: SpotCardSpot;
  savePinState?: SavePinState;
  onPress?: () => void;
};

export function SearchResultCard({
  spot,
  savePinState = 'default',
  onPress,
}: SearchResultCardProps) {
  return (
    <View style={styles.wrap}>
      <SpotCardMapSelection
        spot={spot}
        savePinState={savePinState}
        hideActions
        onCardPress={onPress}
      />
    </View>
  );
}

const MOCK_SPOTS: SpotCardSpot[] = [
  {
    id: 'mock-1',
    title: 'Café del centro',
    description_short: 'Lugar tranquilo para trabajar o leer.',
    cover_image_url: null,
  },
  {
    id: 'mock-2',
    title: 'Playa Norte',
    description_short: 'Arena blanca y aguas calmadas.',
    cover_image_url: null,
  },
  {
    id: 'mock-3',
    title: 'Mirador del atardecer',
    description_short: null,
    cover_image_url: null,
  },
];

/** Showcase para Design System: listado de SearchResultCard (resultados de búsqueda). */
export function SearchResultsShowcase() {
  return (
    <View style={styles.showcase}>
      {MOCK_SPOTS.map((spot, i) => (
        <SearchResultCard
          key={spot.id}
          spot={spot}
          savePinState={i === 0 ? 'toVisit' : i === 1 ? 'visited' : 'default'}
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
