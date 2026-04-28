import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, MapPin, Search } from "lucide-react-native";

import { NativeSheetHeader } from "@/components/explorar/native/NativeSheetHeader";
import { NativeSheetShell } from "@/components/explorar/native/NativeSheetShell";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NativeSpotSearchResult } from "@/lib/explore/native-spot-search";
import { formatGeoKind } from "@/lib/geo/display";
import type { GeoSearchResult } from "@/lib/geo/types";

type NativeExploreSearchSheetProps = {
  visible: boolean;
  query: string;
  isSearching: boolean;
  geoResults: GeoSearchResult[];
  spotResults: NativeSpotSearchResult[];
  onChangeQuery: (query: string) => void;
  onClose: () => void;
  onSelectGeo: (geo: GeoSearchResult) => void;
  onSelectSpot: (spot: NativeSpotSearchResult) => void;
};

export function NativeExploreSearchSheet({
  visible,
  query,
  isSearching,
  geoResults,
  spotResults,
  onChangeQuery,
  onClose,
  onSelectGeo,
  onSelectSpot,
}: NativeExploreSearchSheetProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const trimmedQuery = query.trim();
  const hasResults = geoResults.length > 0 || spotResults.length > 0;

  return (
    <NativeSheetShell
      visible={visible}
      closeLabel="Cerrar búsqueda"
      onClose={onClose}
      keyboardAvoiding
    >
      <NativeSheetHeader
        title="Buscar"
        subtitle="País, ciudad, región o lugar"
        closeLabel="Cerrar búsqueda"
        onClose={onClose}
      />
      <View
        style={[
          styles.inputWrap,
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
          onChangeText={onChangeQuery}
          placeholder="Buscar en Flowya"
          placeholderTextColor={palette.textSecondary}
          returnKeyType="search"
          style={[styles.input, { color: palette.text }]}
          testID="native-explore-search-input"
          value={query}
        />
      </View>
      <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
        {isSearching
          ? "Buscando..."
          : trimmedQuery.length < 2
            ? "Busca un país, región, ciudad o lugar."
            : !hasResults
              ? "Sin resultados oficiales."
              : ""}
      </Text>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
      >
        {geoResults.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
              Destinos oficiales
            </Text>
            {geoResults.map((geo) => (
              <Pressable
                accessibilityLabel={`Abrir ${geo.title}`}
                accessibilityRole="button"
                key={`geo:${geo.entityType}:${geo.id}`}
                onPress={() => onSelectGeo(geo)}
                style={({ pressed }) => [
                  styles.resultRow,
                  {
                    backgroundColor: pressed ? palette.background : "transparent",
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={[styles.resultIcon, { backgroundColor: palette.background }]}>
                  <MapPin size={18} color={palette.primary} strokeWidth={2.2} />
                </View>
                <View style={styles.resultCopy}>
                  <Text style={[styles.resultTitle, { color: palette.text }]} numberOfLines={1}>
                    {geo.title}
                  </Text>
                  <Text
                    style={[styles.resultSubtitle, { color: palette.textSecondary }]}
                    numberOfLines={1}
                  >
                    {formatGeoKind(geo)}
                    {geo.subtitle ? ` · ${geo.subtitle}` : ""}
                  </Text>
                </View>
                {geo.visited || geo.saved ? (
                  <View style={[styles.resultBadge, { backgroundColor: palette.primary }]}>
                    <Check size={14} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
        {spotResults.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
              Lugares del mapa
            </Text>
            {spotResults.map((spot) => (
              <Pressable
                accessibilityLabel={`Ver ${spot.title}`}
                accessibilityRole="button"
                key={`spot:${spot.id}`}
                onPress={() => onSelectSpot(spot)}
                style={({ pressed }) => [
                  styles.resultRow,
                  {
                    backgroundColor: pressed ? palette.background : "transparent",
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={[styles.resultIcon, { backgroundColor: palette.background }]}>
                  <MapPin size={18} color={palette.textSecondary} strokeWidth={2.2} />
                </View>
                <View style={styles.resultCopy}>
                  <Text style={[styles.resultTitle, { color: palette.text }]} numberOfLines={1}>
                    {spot.title}
                  </Text>
                  <Text
                    style={[styles.resultSubtitle, { color: palette.textSecondary }]}
                    numberOfLines={1}
                  >
                    Lugar
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </NativeSheetShell>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  emptyState: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  resultsScroll: {
    marginTop: Spacing.sm,
    maxHeight: 360,
  },
  resultsContent: {
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
    paddingHorizontal: Spacing.xs,
  },
  resultRow: {
    minHeight: 64,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  resultSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  resultBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
