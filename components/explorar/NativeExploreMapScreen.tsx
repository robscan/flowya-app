import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getSupabaseClient, hasSupabaseClientEnv } from "@/lib/supabase";

type NativeSpotMarker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

const INITIAL_REGION: Region = {
  latitude: 20.9674,
  longitude: -89.5926,
  latitudeDelta: 18,
  longitudeDelta: 18,
};

const SPOTS_LIMIT = 150;

export function NativeExploreMapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const [spots, setSpots] = useState<NativeSpotMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSpots() {
      if (!hasSupabaseClientEnv()) {
        if (isMounted) {
          setLoadFailed(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await getSupabaseClient()
          .from("spots")
          .select("id,title,latitude,longitude,is_hidden")
          .eq("is_hidden", false)
          .not("latitude", "is", "null")
          .not("longitude", "is", "null")
          .limit(SPOTS_LIMIT);

        if (error) throw error;

        const nextSpots = (data ?? [])
          .map((spot) => ({
            id: String(spot.id),
            title: typeof spot.title === "string" && spot.title.trim() ? spot.title.trim() : "Lugar",
            latitude: Number(spot.latitude),
            longitude: Number(spot.longitude),
          }))
          .filter((spot) => Number.isFinite(spot.latitude) && Number.isFinite(spot.longitude));

        if (isMounted) {
          setSpots(nextSpots);
          setLoadFailed(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("[NativeExploreMapScreen] spots load failed", error);
        }
        if (isMounted) setLoadFailed(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSpots();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (isLoading) return "Cargando mapa";
    if (loadFailed) return "Mapa listo";
    if (spots.length === 1) return "1 lugar";
    return `${spots.length} lugares`;
  }, [isLoading, loadFailed, spots.length]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            tracksViewChanges={false}
          >
            <View style={styles.markerOuter}>
              <View style={styles.markerInner} />
            </View>
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={2}>
                  {spot.title}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View
        style={[
          styles.statusPill,
          {
            top: insets.top + Spacing.sm,
            backgroundColor: palette.backgroundElevated,
            borderColor: palette.border,
          },
        ]}
        pointerEvents="none"
      >
        {isLoading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
        <Text style={[styles.statusText, { color: palette.text }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusPill: {
    position: "absolute",
    left: Spacing.md,
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  markerOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.18)",
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },
  callout: {
    maxWidth: 180,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  calloutTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
});
