/**
 * Toast de estado del sistema (Scope D+).
 * Notificación breve en la parte superior (debajo de header/botones), auto-oculta.
 * Usar desde useToast().
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TOAST_DURATION_MS = 2500;

export type ToastType = 'success' | 'default';

type ToastContextValue = {
  show: (message: string, options?: { type?: ToastType }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, options?: { type?: ToastType }) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message: msg, type: options?.type ?? 'default' });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={styles.wrapper}>
        {children}
        {toast ? (
          <View style={styles.containerWrap} pointerEvents="none">
            <View
              style={[
                styles.container,
                {
                  backgroundColor:
                    toast.type === 'success'
                      ? colors.stateSuccess
                      : (colors.backgroundElevated ?? colors.background),
                  borderColor:
                    toast.type === 'success'
                      ? colors.stateSuccess
                      : colors.borderSubtle,
                },
                Shadow.card,
              ]}
            >
              <Text
                style={[
                  styles.text,
                  {
                    color:
                      toast.type === 'success'
                        ? '#1d1d1f'
                        : colors.text,
                  },
                ]}
                numberOfLines={2}
              >
                {toast.message}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  containerWrap: {
    position: 'absolute',
    top: Platform.select({ web: 72, default: 88 }),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  container: {
    maxWidth: 400,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
