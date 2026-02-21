/**
 * Design System: Map controls (canonical).
 * Controles canónicos del mapa: Ver el mundo, encuadre contextual, ubicación.
 * Usa IconButton canónico (44×44 circular).
 */

import { Globe, Locate } from 'lucide-react-native';

import { FrameWithDot } from '@/components/icons/FrameWithDot';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { IconButton } from './icon-button';

export type ActiveMapControl = 'world' | 'spot' | 'spot+user' | 'location' | null;

export type MapControlsProps = {
  map: MapboxMap | null;
  onLocate?: () => void;
  selectedSpot?: { id: string } | null;
  onViewWorld?: () => void;
  onReframeSpot?: () => void;
  onReframeSpotAndUser?: () => void;
  hasUserLocation?: boolean;
  activeMapControl?: ActiveMapControl;
};

const ICON_SIZE = 22;

export function MapControls({
  map,
  onLocate,
  selectedSpot = null,
  onViewWorld,
  onReframeSpot,
  onReframeSpotAndUser,
  hasUserLocation = false,
  activeMapControl = null,
}: MapControlsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const enabled = map !== null;
  const iconColor = enabled ? colors.text : colors.textSecondary;

  const showWorld = selectedSpot == null && typeof onViewWorld === 'function';
  const showReframe =
    selectedSpot != null &&
    typeof onReframeSpot === 'function' &&
    typeof onReframeSpotAndUser === 'function';

  const nextReframeModeRef = useRef<'spot' | 'spot+user'>('spot');

  useEffect(() => {
    if (selectedSpot == null) nextReframeModeRef.current = 'spot';
  }, [selectedSpot]);

  const handleReframePress = () => {
    if (!showReframe) return;
    if (!hasUserLocation) {
      nextReframeModeRef.current = 'spot';
      onReframeSpot?.();
      return;
    }
    if (nextReframeModeRef.current === 'spot') {
      onReframeSpot?.();
      nextReframeModeRef.current = 'spot+user';
    } else {
      onReframeSpotAndUser?.();
      nextReframeModeRef.current = 'spot';
    }
  };

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
    <View style={styles.container}>
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
          onPress={handleReframePress}
          disabled={!enabled}
          selected={activeMapControl === 'spot' || activeMapControl === 'spot+user'}
          accessibilityLabel="Encuadre contextual"
        >
          <FrameWithDot size={ICON_SIZE} color={enabled ? colors.text : colors.textSecondary} strokeWidth={2} />
        </IconButton>
      ) : null}
      <IconButton
        variant="default"
        onPress={handleLocate}
        disabled={!enabled}
        selected={activeMapControl === 'location'}
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
    gap: Spacing.xs,
  },
});
