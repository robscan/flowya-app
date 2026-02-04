import '@/styles/mapbox-attribution-overrides.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Locate, MapPin, Route, X } from 'lucide-react-native';

import { FrameWithDot } from '@/components/icons/FrameWithDot';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useState } from 'react';
import type { MapEvent } from 'react-map-gl/mapbox-legacy';
import Map, { Marker } from 'react-map-gl/mapbox-legacy';
import {
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { IconButton } from '@/components/design-system/icon-button';
import { ImageFullscreenModal } from '@/components/design-system/image-fullscreen-modal';
import {
    MapLocationPicker,
    type MapLocationPickerResult,
} from '@/components/design-system/map-location-picker';
import {
    MapPinLocation,
    MapPinSpot,
    type SpotPinStatus,
} from '@/components/design-system/map-pins';
import type { SpotDetailSpot } from '@/components/design-system/spot-detail';
import { SpotDetail } from '@/components/design-system/spot-detail';
import { useToast } from '@/components/ui/toast';
import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    distanceKm,
    formatDistanceKm,
    getMapsDirectionsUrl,
} from '@/lib/geo-utils';
import { getCurrentUserId, getPin, nextPinStatus, removePin, setPinStatus } from '@/lib/pins';
import { shareSpot } from '@/lib/share-spot';
import { supabase } from '@/lib/supabase';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/**
 * Genera HTML estático para cada spot en build time.
 * Sin esto, links compartidos (/spot/xxx) dan 404 en acceso directo.
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const { data } = await supabase.from('spots').select('id');
  return (data ?? []).map((row) => ({ id: row.id }));
}

const MAP_SPOT_HEIGHT = 320;
const MAP_CONTROLS_PADDING = 8;
const FIT_BOUNDS_PADDING = 48;
const FIT_BOUNDS_DURATION_MS = 1200;
const ICON_SIZE = 22;

type UserCoords = { latitude: number; longitude: number } | null;

function SpotDetailMapSlot({
  latitude,
  longitude,
  pinStatus = 'default',
  userCoords,
}: {
  latitude: number;
  longitude: number;
  pinStatus?: SpotPinStatus;
  userCoords: UserCoords;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const mapStyle =
    colorScheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  const onMapLoad = useCallback((e: MapEvent) => {
    setMapInstance(e.target);
  }, []);

  const handleLocate = useCallback(() => {
    if (!mapInstance || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstance.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
          duration: 1500,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [mapInstance]);

  const handleOpenMaps = useCallback(() => {
    const url = getMapsDirectionsUrl(latitude, longitude);
    Linking.openURL(url);
  }, [latitude, longitude]);

  const handleReframe = useCallback(() => {
    if (!mapInstance || !userCoords) return;
    const spotLng = longitude;
    const spotLat = latitude;
    const userLng = userCoords.longitude;
    const userLat = userCoords.latitude;
    const minLng = Math.min(spotLng, userLng);
    const minLat = Math.min(spotLat, userLat);
    const maxLng = Math.max(spotLng, userLng);
    const maxLat = Math.max(spotLat, userLat);
    mapInstance.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: FIT_BOUNDS_PADDING, duration: FIT_BOUNDS_DURATION_MS }
    );
  }, [mapInstance, userCoords, latitude, longitude]);

  const mapEnabled = mapInstance !== null;
  const iconColor = mapEnabled ? colors.text : colors.textSecondary;
  const reframeEnabled = mapEnabled && userCoords !== null;

  if (!MAPBOX_TOKEN) {
    return (
      <View style={[styles.mapPlaceholder, { backgroundColor: Colors.light.border }]}>
        <Text style={[styles.mapPlaceholderText, { color: Colors.light.textSecondary }]}>
          Mapa (configura EXPO_PUBLIC_MAPBOX_TOKEN)
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <Map
        key={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        initialViewState={{
          longitude,
          latitude,
          zoom: 14,
        }}
        style={styles.map}
        onLoad={onMapLoad}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="center">
          <MapPinSpot status={pinStatus} />
        </Marker>
        {userCoords ? (
          <Marker
            longitude={userCoords.longitude}
            latitude={userCoords.latitude}
            anchor="center"
          >
            <MapPinLocation />
          </Marker>
        ) : null}
      </Map>
      <View
        dataSet={{ flowya: 'spot-detail-map-controls' }}
        style={[styles.mapControlsOverlay, { pointerEvents: 'box-none' }]}
      >
        <View style={styles.mapControlsStack}>
          <IconButton
            dataSet={{ flowya: 'spot-detail-map-reframe' }}
            variant="default"
            onPress={handleReframe}
            disabled={!reframeEnabled}
            accessibilityLabel="Ver todos"
          >
            <FrameWithDot
              size={ICON_SIZE}
              color={reframeEnabled ? iconColor : colors.textSecondary}
              strokeWidth={2}
            />
          </IconButton>
          <IconButton
            dataSet={{ flowya: 'spot-detail-map-locate' }}
            variant="default"
            onPress={handleLocate}
            disabled={!mapEnabled}
            accessibilityLabel="Centrar en mi ubicación"
          >
            <Locate size={ICON_SIZE} color={iconColor} strokeWidth={2} />
          </IconButton>
          <IconButton
            dataSet={{ flowya: 'spot-detail-map-directions' }}
            variant="default"
            onPress={handleOpenMaps}
            disabled={!mapEnabled}
            accessibilityLabel="Cómo llegar"
          >
            <Route size={ICON_SIZE} color={iconColor} strokeWidth={2} />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

/** Edit Spot: mapa pasivo (preview) + botón Editar ubicación. Sin controles de ruta/encuadre/ubicación. */
function EditSpotMapSlot({
  latitude,
  longitude,
  onEditLocation,
}: {
  latitude: number;
  longitude: number;
  onEditLocation: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mapStyle =
    colorScheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  if (!MAPBOX_TOKEN) {
    return (
      <View style={[styles.mapPlaceholder, { backgroundColor: Colors.light.border }]}>
        <Text style={[styles.mapPlaceholderText, { color: Colors.light.textSecondary }]}>
          Mapa (configura EXPO_PUBLIC_MAPBOX_TOKEN)
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <Map
        key={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        initialViewState={{ longitude, latitude, zoom: 14 }}
        style={styles.map}
        interactive={false}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="center">
          <MapPinSpot status="default" />
        </Marker>
      </Map>
      <View
        dataSet={{ flowya: 'edit-spot-map-overlay' }}
        style={[styles.editMapOverlay, { pointerEvents: 'box-none' }]}
      >
        <Pressable
          dataSet={{ flowya: 'edit-spot-location-button' }}
          style={({ pressed }) => [
            styles.editLocationButton,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.backgroundElevated : 'transparent',
            },
            WebTouchManipulation,
          ]}
          onPress={onEditLocation}
          accessibilityLabel="Editar ubicación"
          accessibilityRole="button"
        >
          <MapPin size={18} color={colors.text} strokeWidth={2} />
          <Text style={[styles.editLocationButtonLabel, { color: colors.text }]}>
            Editar ubicación
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [spot, setSpot] = useState<SpotDetailSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SpotDetailScreenContent
        id={id}
        colors={colors}
        router={router}
        spot={spot}
        setSpot={setSpot}
        loading={loading}
        setLoading={setLoading}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </>
  );
}

function SpotDetailScreenContent({
  id,
  colors,
  router,
  spot,
  setSpot,
  loading,
  setLoading,
  isEditing,
  setIsEditing,
}: {
  id: string | undefined;
  colors: (typeof Colors)['light'];
  router: ReturnType<typeof useRouter>;
  spot: SpotDetailSpot | null;
  setSpot: React.Dispatch<React.SetStateAction<SpotDetailSpot | null>>;
  loading: boolean;
  setLoading: (v: boolean) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
}) {
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  /** Draft de ubicación al editar (solo local hasta Guardar). */
  const [locationDraft, setLocationDraft] = useState<MapLocationPickerResult | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  /** Ubicación del usuario: una sola vez al cargar el spot. No watchPosition. */
  useEffect(() => {
    if (!spot || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [spot?.id]);

  /** Distancia al spot: calculada una vez con userCoords. No recalcular en re-renders/scroll. */
  const distanceText =
    spot && userCoords
      ? `A ${formatDistanceKm(distanceKm(userCoords.latitude, userCoords.longitude, spot.latitude, spot.longitude))} de tu ubicación`
      : null;

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('id, title, description_short, description_long, cover_image_url, latitude, longitude, address')
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        setSpot(null);
        return;
      }
      const pinStatus = await getPin(id);
      if (cancelled) return;
      setSpot({ ...(data as SpotDetailSpot), pinStatus: pinStatus ?? undefined });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSaveEdit = useCallback(
    async (payload: {
      title: string;
      description_short: string | null;
      description_long: string | null;
    }) => {
      if (!spot?.id) return;
      const updates: Record<string, unknown> = {
        title: payload.title,
        description_short: payload.description_short,
        description_long: payload.description_long,
        updated_at: new Date().toISOString(),
      };
      if (locationDraft) {
        updates.latitude = locationDraft.latitude;
        updates.longitude = locationDraft.longitude;
        updates.address = locationDraft.address;
      }
      const { error } = await supabase
        .from('spots')
        .update(updates)
        .eq('id', spot.id);
      if (!error) {
        setSpot((prev) =>
          prev
            ? {
                ...prev,
                title: payload.title,
                description_short: payload.description_short,
                description_long: payload.description_long,
                ...(locationDraft
                  ? {
                      latitude: locationDraft.latitude,
                      longitude: locationDraft.longitude,
                      address: locationDraft.address,
                    }
                  : {}),
              }
            : null
        );
        setLocationDraft(null);
        setIsEditing(false);
      }
    },
    [spot?.id, locationDraft]
  );

  const handleDeleteSpot = useCallback(async () => {
    if (!spot?.id) return;
    const { error } = await supabase.from('spots').delete().eq('id', spot.id);
    if (!error) router.back();
  }, [spot?.id, router]);

  const toast = useToast();
  const { openAuthModal } = useAuthModal();
  const handleShare = useCallback(async () => {
    if (!spot?.id) return;
    const result = await shareSpot(spot.id, spot.title);
    if (result.copied) toast.show('Link copiado', { type: 'success' });
  }, [spot?.id, spot?.title, toast]);
  const handleSavePin = useCallback(async () => {
    if (!spot?.id) return;
    const current =
      spot.pinStatus === 'to_visit' || spot.pinStatus === 'visited' ? spot.pinStatus : null;
    if (current === 'visited') {
      const ok = await removePin(spot.id);
      if (ok) {
        setSpot((prev) => (prev ? { ...prev, pinStatus: undefined } : null));
        toast.show('Pin quitado', { type: 'success' });
      }
    } else {
      const userId = await getCurrentUserId();
      if (!userId) {
        openAuthModal({
          message: AUTH_MODAL_MESSAGES.savePin,
          onSuccess: handleSavePin,
        });
        return;
      }
      const next = nextPinStatus(current);
      const newStatus = await setPinStatus(spot.id, next);
      if (newStatus !== null) {
        setSpot((prev) => (prev ? { ...prev, pinStatus: newStatus } : null));
        toast.show(newStatus === 'to_visit' ? 'Por visitar' : 'Visitado', { type: 'success' });
      }
    }
  }, [spot?.id, spot?.pinStatus, toast, openAuthModal]);

  if (loading) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Cargando…</Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Spot no encontrado</Text>
        <Text style={{ color: colors.tint, marginTop: Spacing.base }} onPress={() => router.back()}>
          ← Volver
        </Text>
      </View>
    );
  }

  const savePinState =
    spot.pinStatus === 'to_visit' ? 'toVisit' : spot.pinStatus === 'visited' ? 'visited' : 'default';

  return (
    <>
      <SpotDetail
        spot={spot}
        isEditing={isEditing}
        savePinState={savePinState}
        onBack={handleBack}
        onSavePin={handleSavePin}
        onShare={handleShare}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={() => {
          setLocationDraft(null);
          setIsEditing(false);
        }}
        onSaveEdit={handleSaveEdit}
        onDeleteSpot={handleDeleteSpot}
        onImagePress={setFullscreenImageUri}
        onCoverImageChange={(url) =>
          setSpot((prev) => (prev ? { ...prev, cover_image_url: url } : null))
        }
        mapSlot={
          isEditing ? (
            <EditSpotMapSlot
              latitude={locationDraft?.latitude ?? spot.latitude}
              longitude={locationDraft?.longitude ?? spot.longitude}
              onEditLocation={() => setShowLocationPicker(true)}
            />
          ) : (
            <SpotDetailMapSlot
              latitude={spot.latitude}
              longitude={spot.longitude}
              pinStatus={spot.pinStatus}
              userCoords={userCoords}
            />
          )
        }
        distanceText={distanceText}
      />
      <ImageFullscreenModal
        visible={!!fullscreenImageUri}
        uri={fullscreenImageUri}
        onClose={() => setFullscreenImageUri(null)}
      />
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={[styles.locationPickerModal, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.locationPickerHeader,
              { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.locationPickerTitle, { color: colors.text }]}>
              Selecciona la ubicación del spot
            </Text>
            <Pressable
              style={styles.locationPickerCloseTouch}
              onPress={() => setShowLocationPicker(false)}
              hitSlop={12}
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <X size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.locationPickerContent}>
            <MapLocationPicker
              initialLatitude={locationDraft?.latitude ?? spot.latitude}
              initialLongitude={locationDraft?.longitude ?? spot.longitude}
              onConfirm={(result) => {
                setLocationDraft(result);
                setShowLocationPicker(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: MAP_SPOT_HEIGHT,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapControlsOverlay: {
    position: 'absolute',
    right: MAP_CONTROLS_PADDING,
    bottom: MAP_CONTROLS_PADDING,
    zIndex: 10,
  },
  mapControlsStack: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  mapPlaceholder: {
    flex: 1,
    width: '100%',
    height: MAP_SPOT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
  },
  editMapOverlay: {
    position: 'absolute',
    left: MAP_CONTROLS_PADDING,
    right: MAP_CONTROLS_PADDING,
    bottom: MAP_CONTROLS_PADDING,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  editLocationButtonLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
  locationPickerModal: {
    flex: 1,
  },
  locationPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'web' ? Spacing.md : 48,
    borderBottomWidth: 1,
  },
  locationPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  locationPickerCloseTouch: {
    padding: Spacing.sm,
  },
  locationPickerContent: {
    flex: 1,
  },
});
