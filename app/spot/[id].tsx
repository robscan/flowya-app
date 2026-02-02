/**
 * Spot detail screen (native placeholder).
 * Full detail is web-only in this phase.
 */

import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SpotDetailPlaceholder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Spot' }} />
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        <Text style={{ ...styles.text, color: colors.text }}>Spot {id ?? '—'}</Text>
        <Text style={{ ...styles.subtitle, color: colors.icon }}>
          Spot detail is available on web.
        </Text>
        <Link href="/(tabs)" asChild>
          <Text style={{ ...styles.backLink, color: colors.tint }}>← Back</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  backLink: {
    fontSize: 16,
    fontWeight: '500',
  },
});
