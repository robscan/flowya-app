/**
 * Design System: Map controls (canonical).
 * View all (fit bounds), zoom in/out, locate. Usa IconButton canónico (44×44 circular).
 *
 * MapControlButton / ViewAll:
 * - Propósito: encuadrar el mapa para mostrar ubicación del usuario + spots visibles según el filtro.
 * - Ícono: FrameWithDot (custom, marco + punto central).
 * - Estados: default, pressed, disabled (cuando no hay spots visibles).
 */

import { Locate } from 'lucide-react-native';

import { FrameWithDot } from '@/components/icons/FrameWithDot';
import type { Map as MapboxMap } from 'mapbox-gl';
import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { IconButton } from './icon-button';

export type MapControlsProps = {
  /** Map instance (Mapbox). When null, buttons are disabled (e.g. Design System showcase). */
  map: MapboxMap | null;
  /** Callback when locate is pressed (caller can run geolocation and then map.flyTo). */
  onLocate?: () => void;
  /** Callback when "ver todo" is pressed (caller runs fitBounds con spots visibles). */
  onViewAll?: () => void;
  /** Si false, el botón ViewAll está disabled (ej. sin spots visibles). */
  hasVisibleSpots?: boolean;
};

const ICON_SIZE = 22;

export function MapControls({ map, onLocate, onViewAll, hasVisibleSpots = false }: MapControlsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const enabled = map !== null;
  const iconColor = enabled ? colors.text : colors.textSecondary;
  const viewAllEnabled = enabled && hasVisibleSpots && typeof onViewAll === 'function';

  const handleLocate = () => {
    if (onLocate) onLocate();
    else if (enabled && map && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 14,
            duration: 1500,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  };

  return (
    <View dataSet={{ flowya: 'map-controls' }} style={styles.container}>
      <IconButton
        dataSet={{ flowya: 'map-controls-view-all' }}
        variant="default"
        onPress={onViewAll}
        disabled={!viewAllEnabled}
        accessibilityLabel="Ver todos los spots"
      >
        <FrameWithDot
          size={ICON_SIZE}
          color={viewAllEnabled ? colors.text : colors.textSecondary}
          strokeWidth={2}
        />
      </IconButton>
      <IconButton
        dataSet={{ flowya: 'map-controls-locate' }}
        variant="default"
        onPress={handleLocate}
        disabled={!enabled}
        accessibilityLabel="Center on my location"
      >
        <Locate size={ICON_SIZE} color={iconColor} strokeWidth={2} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
});
