/**
 * Design System screen placeholder (native).
 * Full Design System is web-only; use the web app to view it.
 */

import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DesignSystemPlaceholder() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Design System' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Design System</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Design System is available on web. Open this app in a browser to view canonical UI
          components.
        </Text>
        <Link href="/(tabs)/explore" asChild>
          <Text style={[styles.link, { color: colors.tint }]}>← Back to Explore</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  link: {
    fontSize: 16,
    fontWeight: '500',
  },
});
