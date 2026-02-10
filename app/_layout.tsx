// FLOWYA v0.34 — Frozen baseline (post-search)
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ToastProvider } from '@/components/ui/toast';
import { AuthModalProvider } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <AuthModalProvider>
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mapaV0" options={{ headerShown: false }} />
        <Stack.Screen name="create-spot/index" options={{ title: 'Crear spot' }} />
        <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
          </AuthModalProvider>
        <StatusBar style="auto" />
      </ToastProvider>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}
