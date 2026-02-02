import '@/styles/mapbox-attribution-overrides.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox-legacy';
import { StyleSheet, Text, View } from 'react-native';

import { ImageFullscreenModal } from '@/components/design-system/image-fullscreen-modal';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { MapPinSpot } from '@/components/design-system/map-pins';
import type { SpotDetailSpot } from '@/components/design-system/spot-detail';
import { SpotDetail } from '@/components/design-system/spot-detail';
import { useToast } from '@/components/ui/toast';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUserId, getPin, nextPinStatus, removePin, setPinStatus } from '@/lib/pins';
import { shareSpot } from '@/lib/share-spot';
import { supabase } from '@/lib/supabase';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const MAP_SPOT_HEIGHT = 200;

function SpotDetailMapSlot({
  latitude,
  longitude,
  pinStatus = 'default',
}: {
  latitude: number;
  longitude: number;
  pinStatus?: SpotPinStatus;
}) {
  const colorScheme = useColorScheme();
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
        initialViewState={{
          longitude,
          latitude,
          zoom: 14,
        }}
        style={styles.map}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="center">
          <MapPinSpot status={pinStatus} />
        </Marker>
      </Map>
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
      const { error } = await supabase
        .from('spots')
        .update({
          title: payload.title,
          description_short: payload.description_short,
          description_long: payload.description_long,
          updated_at: new Date().toISOString(),
        })
        .eq('id', spot.id);
      if (!error) {
        setSpot((prev) =>
          prev
            ? {
                ...prev,
                title: payload.title,
                description_short: payload.description_short,
                description_long: payload.description_long,
              }
            : null
        );
        setIsEditing(false);
      }
    },
    [spot?.id]
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
          message: 'Crea una cuenta para guardar tus lugares',
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
        onCancelEdit={() => setIsEditing(false)}
        onSaveEdit={handleSaveEdit}
        onDeleteSpot={handleDeleteSpot}
        onImagePress={setFullscreenImageUri}
        onCoverImageChange={(url) =>
          setSpot((prev) => (prev ? { ...prev, cover_image_url: url } : null))
        }
        mapSlot={
          <SpotDetailMapSlot
            latitude={spot.latitude}
            longitude={spot.longitude}
            pinStatus={spot.pinStatus}
          />
        }
      />
      <ImageFullscreenModal
        visible={!!fullscreenImageUri}
        uri={fullscreenImageUri}
        onClose={() => setFullscreenImageUri(null)}
      />
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
  },
  map: {
    width: '100%',
    height: '100%',
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
});
