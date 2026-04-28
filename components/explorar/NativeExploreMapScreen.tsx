import { useEffect, useMemo, useState } from "react";
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
import { Search, User, X } from "lucide-react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/design-system/icon-button";
import { TypographyStyles } from "@/components/design-system/typography";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const [spots, setSpots] = useState<NativeSpotMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
              La búsqueda global V1 se conectará por contrato a entidades geo oficiales y spots deduplicados.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
