/**
 * Create Spot screen (native placeholder).
 * Full wizard is web-only in this phase.
 */

import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CreateSpotPlaceholder() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Crear spot' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>Crear spot</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          El wizard de creación está disponible en web.
        </Text>
        <Link href="/(tabs)" asChild>
          <Text style={[styles.backLink, { color: colors.tint }]}>← Volver al mapa</Text>
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
    fontSize: 15,
    marginBottom: 24,
  },
  backLink: {
    fontSize: 16,
    fontWeight: '500',
  },
});
