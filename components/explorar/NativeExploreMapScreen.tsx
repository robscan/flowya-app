import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, User } from "lucide-react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/design-system/icon-button";
import { NativeExploreSearchSheet } from "@/components/explorar/native/NativeExploreSearchSheet";
import { NativeGeoSheet } from "@/components/explorar/native/NativeGeoSheet";
import { NativeSpotSheet } from "@/components/explorar/native/NativeSpotSheet";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  filterNativeSpotResults,
  type NativeSearchSpot,
  type NativeSpotSearchResult,
} from "@/lib/explore/native-spot-search";
import { searchGeoEntities } from "@/lib/geo/search";
import {
  deleteUserGeoMark,
  GeoMarkAuthRequiredError,
  saveUserGeoMark,
} from "@/lib/geo/user-geo-marks";
import type { GeoSearchResult, UserGeoMarkState } from "@/lib/geo/types";
import { getSupabaseClient, hasSupabaseClientEnv } from "@/lib/supabase";

type NativeSpotMarker = NativeSearchSpot;

const INITIAL_REGION: Region = {
  latitude: 20.9674,
  longitude: -89.5926,
  latitudeDelta: 18,
  longitudeDelta: 18,
};

const SPOTS_LIMIT = 150;

export function NativeExploreMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const mapRef = useRef<MapView | null>(null);
  const [spots, setSpots] = useState<NativeSpotMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoSearchResult[]>([]);
  const [isGeoSearching, setIsGeoSearching] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<GeoSearchResult | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<NativeSpotMarker | null>(null);
  const [geoSheetMessage, setGeoSheetMessage] = useState<string | null>(null);
  const [savingMark, setSavingMark] = useState<UserGeoMarkState | "clear" | null>(null);

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

  useEffect(() => {
    const query = searchQuery.trim();
    if (!isSearchOpen || query.length < 2) {
      setGeoResults([]);
      setIsGeoSearching(false);
      return;
    }

    let isCurrent = true;
    setIsGeoSearching(true);
    const timeout = setTimeout(() => {
      searchGeoEntities(query, { limit: 8 })
        .then((results) => {
          if (isCurrent) setGeoResults(results);
        })
        .catch((error) => {
          if (__DEV__) {
            console.warn("[NativeExploreMapScreen] geo search failed", error);
          }
          if (isCurrent) setGeoResults([]);
        })
        .finally(() => {
          if (isCurrent) setIsGeoSearching(false);
        });
    }, 220);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [isSearchOpen, searchQuery]);

  const focusGeoOnMap = useCallback((geo: GeoSearchResult) => {
    if (geo.bbox) {
      mapRef.current?.fitToCoordinates(
        [
          { latitude: geo.bbox.south, longitude: geo.bbox.west },
          { latitude: geo.bbox.north, longitude: geo.bbox.east },
        ],
        {
          animated: true,
          edgePadding: { top: 120, right: 48, bottom: 220, left: 48 },
        },
      );
      return;
    }

    if (geo.centroidLatitude != null && geo.centroidLongitude != null) {
      mapRef.current?.animateToRegion(
        {
          latitude: geo.centroidLatitude,
          longitude: geo.centroidLongitude,
          latitudeDelta: geo.entityType === "country" ? 14 : geo.entityType === "region" ? 4 : 0.18,
          longitudeDelta: geo.entityType === "country" ? 14 : geo.entityType === "region" ? 4 : 0.18,
        },
        350,
      );
    }
  }, []);

  const handleSelectGeo = useCallback(
    (geo: GeoSearchResult) => {
      setSelectedGeo(geo);
      setSelectedSpot(null);
      setGeoSheetMessage(null);
      setIsSearchOpen(false);
      focusGeoOnMap(geo);
    },
    [focusGeoOnMap],
  );

  const focusSpotOnMap = useCallback((spot: NativeSpotMarker) => {
    mapRef.current?.animateToRegion(
      {
        latitude: spot.latitude,
        longitude: spot.longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      },
      350,
    );
  }, []);

  const handleSelectSpot = useCallback(
    (spot: NativeSpotSearchResult) => {
      setSelectedGeo(null);
      setSelectedSpot(spot);
      setIsSearchOpen(false);
      focusSpotOnMap(spot);
    },
    [focusSpotOnMap],
  );

  const handleSaveGeoMark = useCallback(
    async (state: UserGeoMarkState) => {
      if (!selectedGeo) return;
      setSavingMark(state);
      setGeoSheetMessage(null);
      try {
        const mark = await saveUserGeoMark(selectedGeo.entityType, selectedGeo.id, state);
        const nextGeo: GeoSearchResult = {
          ...selectedGeo,
          saved: mark.saved,
          visited: mark.visited,
        };
        setSelectedGeo(nextGeo);
        setGeoResults((results) =>
          results.map((result) => (result.id === nextGeo.id && result.entityType === nextGeo.entityType ? nextGeo : result)),
        );
        setGeoSheetMessage(state === "visited" ? "Marcado como visitado." : "Guardado.");
      } catch (error) {
        if (error instanceof GeoMarkAuthRequiredError) {
          setGeoSheetMessage("Inicia sesión para guardar.");
        } else {
          setGeoSheetMessage("No se pudo guardar. Intenta de nuevo.");
        }
      } finally {
        setSavingMark(null);
      }
    },
    [selectedGeo],
  );

  const handleClearGeoMark = useCallback(async () => {
    if (!selectedGeo) return;
    setSavingMark("clear");
    setGeoSheetMessage(null);
    try {
      await deleteUserGeoMark(selectedGeo.entityType, selectedGeo.id);
      const nextGeo: GeoSearchResult = {
        ...selectedGeo,
        saved: false,
        visited: false,
      };
      setSelectedGeo(nextGeo);
      setGeoResults((results) =>
        results.map((result) =>
          result.id === nextGeo.id && result.entityType === nextGeo.entityType ? nextGeo : result,
        ),
      );
      setGeoSheetMessage("Marca quitada.");
    } catch (error) {
      if (error instanceof GeoMarkAuthRequiredError) {
        setGeoSheetMessage("Inicia sesión para actualizar.");
      } else {
        setGeoSheetMessage("No se pudo actualizar. Intenta de nuevo.");
      }
    } finally {
      setSavingMark(null);
    }
  }, [selectedGeo]);

  const statusLabel = useMemo(() => {
    if (isLoading) return "Cargando mapa";
    if (loadFailed) return "Mapa listo";
    return "Explorar mapa";
  }, [isLoading, loadFailed]);

  const spotResults = useMemo(
    () => filterNativeSpotResults(spots, searchQuery, 8),
    [searchQuery, spots],
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <MapView
        ref={mapRef}
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
          styles.topChrome,
          {
            top: insets.top + Spacing.sm,
          },
        ]}
      >
        <IconButton
          accessibilityLabel="Abrir cuenta"
          onPress={() => router.push("/account")}
          testID="native-explore-account-button"
        >
          <User size={21} color={palette.text} strokeWidth={2.2} />
        </IconButton>
        <IconButton
          accessibilityLabel="Abrir búsqueda"
          onPress={() => setIsSearchOpen(true)}
          testID="native-explore-search-button"
        >
          <Search size={21} color={palette.text} strokeWidth={2.2} />
        </IconButton>
      </View>

      <View
        style={[
          styles.statusPill,
          {
            top: insets.top + 64,
            backgroundColor: palette.backgroundElevated,
            borderColor: palette.border,
          },
        ]}
        pointerEvents="none"
      >
        {isLoading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
        <Text style={[styles.statusText, { color: palette.text }]}>{statusLabel}</Text>
      </View>

      <NativeExploreSearchSheet
        visible={isSearchOpen}
        query={searchQuery}
        isSearching={isGeoSearching}
        geoResults={geoResults}
        spotResults={spotResults}
        onChangeQuery={setSearchQuery}
        onClose={() => setIsSearchOpen(false)}
        onSelectGeo={handleSelectGeo}
        onSelectSpot={handleSelectSpot}
      />

      <NativeGeoSheet
        geo={selectedGeo}
        message={geoSheetMessage}
        savingMark={savingMark}
        onClose={() => setSelectedGeo(null)}
        onSaveMark={handleSaveGeoMark}
        onClearMark={handleClearGeoMark}
      />

      <NativeSpotSheet spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topChrome: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    elevation: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    position: "absolute",
    left: Spacing.md,
    zIndex: 9,
    elevation: 9,
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
