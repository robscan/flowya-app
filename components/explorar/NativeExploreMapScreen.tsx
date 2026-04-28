import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Check, MapPin, Search, User, X } from "lucide-react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/design-system/icon-button";
import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchGeoEntities } from "@/lib/geo/search";
import { GeoMarkAuthRequiredError, saveUserGeoMark } from "@/lib/geo/user-geo-marks";
import type { GeoSearchResult, UserGeoMarkState } from "@/lib/geo/types";
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
  const [geoSheetMessage, setGeoSheetMessage] = useState<string | null>(null);
  const [savingMark, setSavingMark] = useState<UserGeoMarkState | null>(null);

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
      setGeoSheetMessage(null);
      setIsSearchOpen(false);
      focusGeoOnMap(geo);
    },
    [focusGeoOnMap],
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

  const statusLabel = useMemo(() => {
    if (isLoading) return "Cargando mapa";
    if (loadFailed) return "Mapa listo";
    return "Explorar mapa";
  }, [isLoading, loadFailed]);

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

      <Modal
        animationType="slide"
        transparent
        visible={isSearchOpen}
        onRequestClose={() => setIsSearchOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            accessibilityLabel="Cerrar búsqueda"
            accessibilityRole="button"
            onPress={() => setIsSearchOpen(false)}
            style={styles.modalBackdrop}
          />
          <View
            style={[
              styles.searchSheet,
              {
                backgroundColor: palette.backgroundElevated,
                paddingBottom: insets.bottom + Spacing.lg,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.searchHeader}>
              <View style={styles.searchTitleGroup}>
                <Text style={[TypographyStyles.heading3, { color: palette.text }]}>Buscar</Text>
                <Text style={[styles.searchHint, { color: palette.textSecondary }]}>
                  País, ciudad, región o lugar
                </Text>
              </View>
              <IconButton
                accessibilityLabel="Cerrar búsqueda"
                onPress={() => setIsSearchOpen(false)}
                size={40}
              >
                <X size={20} color={palette.text} strokeWidth={2.2} />
              </IconButton>
            </View>
            <View
              style={[
                styles.searchInputWrap,
                {
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                },
              ]}
            >
              <Search size={19} color={palette.textSecondary} strokeWidth={2.2} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                clearButtonMode="while-editing"
                inputMode="search"
                onChangeText={setSearchQuery}
                placeholder="Buscar en Flowya"
                placeholderTextColor={palette.textSecondary}
                returnKeyType="search"
                style={[styles.searchInput, { color: palette.text }]}
                testID="native-explore-search-input"
                value={searchQuery}
              />
            </View>
            <Text style={[styles.searchEmptyState, { color: palette.textSecondary }]}>
              {isGeoSearching
                ? "Buscando..."
                : searchQuery.trim().length < 2
                  ? "Busca un país, región o ciudad."
                  : geoResults.length === 0
                    ? "Sin resultados oficiales."
                    : ""}
            </Text>
            <View style={styles.geoResultsList}>
              {geoResults.map((geo) => (
                <Pressable
                  accessibilityLabel={`Abrir ${geo.title}`}
                  accessibilityRole="button"
                  key={`${geo.entityType}:${geo.id}`}
                  onPress={() => handleSelectGeo(geo)}
                  style={({ pressed }) => [
                    styles.geoResultRow,
                    {
                      backgroundColor: pressed ? palette.background : "transparent",
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <View style={[styles.geoResultIcon, { backgroundColor: palette.background }]}>
                    <MapPin size={18} color={palette.primary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.geoResultCopy}>
                    <Text style={[styles.geoResultTitle, { color: palette.text }]} numberOfLines={1}>
                      {geo.title}
                    </Text>
                    <Text style={[styles.geoResultSubtitle, { color: palette.textSecondary }]} numberOfLines={1}>
                      {formatGeoKind(geo)}
                      {geo.subtitle ? ` · ${geo.subtitle}` : ""}
                    </Text>
                  </View>
                  {geo.visited || geo.saved ? (
                    <View style={[styles.geoResultBadge, { backgroundColor: palette.primary }]}>
                      <Check size={14} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={selectedGeo != null}
        onRequestClose={() => setSelectedGeo(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Cerrar ficha"
            accessibilityRole="button"
            onPress={() => setSelectedGeo(null)}
            style={styles.modalBackdrop}
          />
          {selectedGeo ? (
            <View
              style={[
                styles.geoSheet,
                {
                  backgroundColor: palette.backgroundElevated,
                  paddingBottom: insets.bottom + Spacing.lg,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.searchHeader}>
                <View style={styles.searchTitleGroup}>
                  <Text style={[TypographyStyles.heading3, { color: palette.text }]} numberOfLines={2}>
                    {selectedGeo.title}
                  </Text>
                  <Text style={[styles.searchHint, { color: palette.textSecondary }]}>
                    {formatGeoKind(selectedGeo)}
                    {selectedGeo.subtitle ? ` · ${selectedGeo.subtitle}` : ""}
                  </Text>
                </View>
                <IconButton accessibilityLabel="Cerrar ficha" onPress={() => setSelectedGeo(null)} size={40}>
                  <X size={20} color={palette.text} strokeWidth={2.2} />
                </IconButton>
              </View>
              <View style={styles.geoActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={savingMark != null}
                  onPress={() => handleSaveGeoMark("saved")}
                  style={[
                    styles.geoActionButton,
                    {
                      backgroundColor: selectedGeo.saved ? palette.primary : palette.background,
                      borderColor: selectedGeo.saved ? palette.primary : palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.geoActionText, { color: selectedGeo.saved ? "#FFFFFF" : palette.text }]}>
                    {savingMark === "saved" ? "Guardando..." : "Por visitar"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={savingMark != null}
                  onPress={() => handleSaveGeoMark("visited")}
                  style={[
                    styles.geoActionButton,
                    {
                      backgroundColor: selectedGeo.visited ? palette.primary : palette.background,
                      borderColor: selectedGeo.visited ? palette.primary : palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.geoActionText, { color: selectedGeo.visited ? "#FFFFFF" : palette.text }]}>
                    {savingMark === "visited" ? "Guardando..." : "Visitado"}
                  </Text>
                </Pressable>
              </View>
              {geoSheetMessage ? (
                <Text style={[styles.geoSheetMessage, { color: palette.textSecondary }]}>{geoSheetMessage}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function formatGeoKind(geo: Pick<GeoSearchResult, "entityType">): string {
  if (geo.entityType === "country") return "País";
  if (geo.entityType === "region") return "Región";
  return "Ciudad";
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
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  searchSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchTitleGroup: {
    flex: 1,
  },
  searchHint: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  searchInputWrap: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  searchEmptyState: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  geoResultsList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  geoResultRow: {
    minHeight: 64,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  geoResultIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  geoResultCopy: {
    flex: 1,
    minWidth: 0,
  },
  geoResultTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  geoResultSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  geoResultBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  geoSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  geoActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  geoActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  geoActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  geoSheetMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
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
