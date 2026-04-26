import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getMapSpotShareUrl } from "@/lib/explore-deeplink";

export default function SpotShareFallbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const href = id ? getMapSpotShareUrl(id) : "/";

  useEffect(() => {
    if (!id) return;
    try {
      (router.replace as (next: string) => void)(href);
    } catch {
      // ignore and keep fallback UI visible
    }
  }, [href, id, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Abriendo lugar…</Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          Si no te redirigimos automáticamente, vuelve a intentar desde FLOWYA.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 420,
  },
});
