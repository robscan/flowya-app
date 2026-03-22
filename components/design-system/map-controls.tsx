/**
 * Design System: Map controls (canonical).
 * Controles canónicos del mapa: Ver el mundo, encuadre contextual (ciclo zoom mismo lugar), ubicación.
 * Usa IconButton canónico (44×44 circular).
 */

import { Globe, Locate } from 'lucide-react-native';

import { FrameWithDot } from '@/components/icons/FrameWithDot';
import type { Map as MapboxMap } from 'mapbox-gl';
import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { IconButton } from './icon-button';

export type ActiveMapControl = 'world' | 'spot' | 'location' | 'location-north' | null;

export type MapControlsProps = {
  map: MapboxMap | null;
  onLocate?: () => void;
  selectedSpot?: { id: string } | null;
  onViewWorld?: () => void;
  /** Ciclo detalle → barrio → contexto sobre el mismo foco (spot/POI). */
  onReframeSpot?: () => void;
  activeMapControl?: ActiveMapControl;
};

const ICON_SIZE = 22;

export function MapControls({
  map,
  onLocate,
  selectedSpot = null,
  onViewWorld,
  onReframeSpot,
  activeMapControl = null,
}: MapControlsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const enabled = map !== null;
  const iconColor = enabled ? colors.text : colors.textSecondary;

  const showWorld = selectedSpot == null && typeof onViewWorld === 'function';
  const showReframe = selectedSpot != null && typeof onReframeSpot === 'function';

  const handleLocate = () => {
    if (onLocate) onLocate();
  };

  return (
    <View style={styles.container}>
      <IconButton
        variant="default"
        onPress={handleLocate}
        disabled={!enabled}
        selected={activeMapControl === 'location' || activeMapControl === 'location-north'}
        accessibilityLabel="Center on my location"
      >
        <Locate size={ICON_SIZE} color={iconColor} strokeWidth={2} />
      </IconButton>
      {showWorld ? (
        <IconButton
          variant="default"
          onPress={onViewWorld}
          disabled={!enabled}
          selected={activeMapControl === 'world'}
          accessibilityLabel="Ver el mundo"
        >
          <Globe size={ICON_SIZE} color={enabled ? colors.text : colors.textSecondary} strokeWidth={2} />
        </IconButton>
      ) : null}
      {showReframe ? (
        <IconButton
          variant="default"
          onPress={onReframeSpot}
          disabled={!enabled}
          selected={activeMapControl === 'spot'}
          accessibilityLabel="Encuadre del lugar"
        >
          <FrameWithDot size={ICON_SIZE} color={enabled ? colors.text : colors.textSecondary} strokeWidth={2} />
        </IconButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    // Espaciado más cómodo para evitar taps accidentales entre controles.
    gap: Spacing.sm,
  },
});
