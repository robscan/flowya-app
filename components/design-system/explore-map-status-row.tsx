import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { ExploreCountriesFlowsPill } from '@/components/design-system/explore-countries-flows-pill';
import { FlowyaFeedbackTrigger } from '@/components/design-system/flowya-feedback-trigger';

export type ExploreMapStatusRowFlowsBadge = {
  countriesCount: number;
  flowsPoints: number;
  onPress: () => void;
  accessibilityLabel?: string;
};

export type ExploreMapStatusRowProps = {
  onFlowyaPress: () => void;
  /** Izquierda: letrero FLOWYA (beta). */
  flowyaLabel?: string;
  flowyaAccessibilityLabel?: string;
  /** Derecha: pastilla países | flows; si falta, solo FLOWYA (paridad MapScreen). */
  flowsBadge?: ExploreMapStatusRowFlowsBadge | null;
  style?: ViewProps['style'];
};

/**
 * Fila inferior del mapa Explore: FLOWYA (izquierda) y ExploreCountriesFlowsPill (derecha).
 * El posicionamiento absoluto e insets los aplica la pantalla; este componente solo compone la fila.
 */
export function ExploreMapStatusRow({
  onFlowyaPress,
  flowyaLabel,
  flowyaAccessibilityLabel,
  flowsBadge,
  style,
}: ExploreMapStatusRowProps) {
  return (
    <View style={[styles.row, style]} pointerEvents="box-none">
      <FlowyaFeedbackTrigger
        onPress={onFlowyaPress}
        label={flowyaLabel}
        accessibilityLabel={flowyaAccessibilityLabel}
      />
      {flowsBadge != null ? (
        <ExploreCountriesFlowsPill
          countriesCount={flowsBadge.countriesCount}
          flowsPoints={flowsBadge.flowsPoints}
          onPress={flowsBadge.onPress}
          accessibilityLabel={flowsBadge.accessibilityLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
});
