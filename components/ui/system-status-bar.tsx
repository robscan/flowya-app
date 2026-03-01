import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SYSTEM_STATUS_DURATION_MS = 2500;
const MAX_VISIBLE_MESSAGES = 3;
const DEFAULT_TOP_WEB = 72;
const DEFAULT_TOP_NATIVE = 88;

type SystemStatusAnchor = {
  placement: 'top-center' | 'bottom-left';
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type SystemStatusType = 'success' | 'default' | 'error';

type SystemStatusMessage = {
  id: number;
  text: string;
  type: SystemStatusType;
};

type SystemStatusContextValue = {
  /** replaceVisible=true: útil para mensajes de filtro que no deben apilarse. */
  show: (message: string, options?: { type?: SystemStatusType; replaceVisible?: boolean }) => void;
  setAnchor: (anchor: SystemStatusAnchor) => void;
  resetAnchor: () => void;
};

const SystemStatusContext = createContext<SystemStatusContextValue | null>(null);

export function useSystemStatus(): SystemStatusContextValue {
  const ctx = useContext(SystemStatusContext);
  if (!ctx) throw new Error('useSystemStatus must be used within SystemStatusProvider');
  return ctx;
}

function resolveMessageColors(
  type: SystemStatusType,
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'],
  mode: 'light' | 'dark'
): { textColor: string; backgroundColor: string; textShadowColor: string; borderColor: string } {
  if (mode === 'light') {
    return {
      textColor: colors.text,
      backgroundColor: 'rgba(255,255,255,0.88)',
      textShadowColor: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(255,255,255,0.92)',
    };
  }
  if (type === 'success') {
    return {
      textColor: '#e8fff0',
      backgroundColor: 'rgba(0,0,0,0.32)',
      textShadowColor: 'rgba(0,0,0,0.88)',
      borderColor: 'rgba(0,0,0,0.4)',
    };
  }
  if (type === 'error') {
    return {
      textColor: '#ffe5e3',
      backgroundColor: 'rgba(0,0,0,0.32)',
      textShadowColor: 'rgba(0,0,0,0.88)',
      borderColor: 'rgba(0,0,0,0.4)',
    };
  }
  return {
    textColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.32)',
    textShadowColor: 'rgba(0,0,0,0.88)',
    borderColor: 'rgba(0,0,0,0.4)',
  };
}

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<SystemStatusMessage[]>([]);
  const [anchor, setAnchorState] = useState<SystemStatusAnchor>({
    placement: 'top-center',
    top: Platform.select({ web: DEFAULT_TOP_WEB, default: DEFAULT_TOP_NATIVE }),
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(1);
  const opacity = useRef(new Animated.Value(0)).current;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const show = useCallback((message: string, options?: { type?: SystemStatusType; replaceVisible?: boolean }) => {
    const next: SystemStatusMessage = {
      id: idRef.current,
      text: message,
      type: options?.type ?? 'default',
    };
    idRef.current += 1;

    // Modo reemplazo para evitar ruido visual cuando el usuario cambia rápido de contexto.
    setMessages((prev) =>
      options?.replaceVisible ? [next] : [...prev, next].slice(-MAX_VISIBLE_MESSAGES),
    );

    Animated.timing(opacity, {
      toValue: 1,
      duration: 140,
      useNativeDriver: false,
    }).start();

    clearTimer();
    timeoutRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        setMessages([]);
      });
      timeoutRef.current = null;
    }, SYSTEM_STATUS_DURATION_MS);
  }, [clearTimer, opacity]);

  const setAnchor = useCallback((nextAnchor: SystemStatusAnchor) => {
    setAnchorState(nextAnchor);
  }, []);

  const resetAnchor = useCallback(() => {
    setAnchorState({
      placement: 'top-center',
      top: Platform.select({ web: DEFAULT_TOP_WEB, default: DEFAULT_TOP_NATIVE }),
    });
  }, []);

  const contextValue = useMemo(
    () => ({ show, setAnchor, resetAnchor }),
    [show, setAnchor, resetAnchor],
  );
  const resolvedMode: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';
  const activeMessageType: SystemStatusType = messages[messages.length - 1]?.type ?? 'default';
  const activePalette = resolveMessageColors(activeMessageType, Colors[resolvedMode], resolvedMode);

  // Permite anclar la barra por pantalla (top-center por defecto, bottom-left en Explore).
  const overlayPositionStyle =
    anchor.placement === 'bottom-left'
      ? ({
          top: undefined,
          left: anchor.left ?? Spacing.base,
          right: anchor.right,
          bottom: anchor.bottom ?? Spacing.base,
          alignItems: 'flex-start',
          paddingHorizontal: 0,
        } as const)
      : ({
          top: anchor.top ?? Platform.select({ web: DEFAULT_TOP_WEB, default: DEFAULT_TOP_NATIVE }),
          left: 0,
          right: 0,
          bottom: undefined,
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
        } as const);

  return (
    <SystemStatusContext.Provider value={contextValue}>
      <View style={styles.wrapper}>
        {children}
        {messages.length > 0 ? (
          <Animated.View style={[styles.overlay, overlayPositionStyle, { opacity, pointerEvents: 'none' }]}>
            <View
              accessibilityRole="status"
              accessibilityLiveRegion="polite"
              style={[
                styles.stack,
                {
                  backgroundColor: activePalette.backgroundColor,
                  borderColor: activePalette.borderColor,
                },
                anchor.placement === 'bottom-left' ? styles.stackBottomLeft : styles.stackTopCenter,
              ]}
            >
              {messages.map((message) => {
                const palette = resolveMessageColors(message.type, Colors[resolvedMode], resolvedMode);
                return (
                  <Text
                    key={message.id}
                    style={[
                      styles.textSubtitle,
                      { color: palette.textColor },
                      Platform.select({
                        web: {
                          textShadow: `0px 1px 8px ${palette.textShadowColor}`,
                        },
                        default: {
                          textShadowColor: palette.textShadowColor,
                          textShadowRadius: 8,
                          textShadowOffset: { width: 0, height: 1 },
                        },
                      }),
                    ]}
                    numberOfLines={2}
                  >
                    {message.text}
                  </Text>
                );
              })}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </SystemStatusContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    zIndex: 12,
  },
  stack: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Shadow.card,
  },
  stackTopCenter: {
    maxWidth: 420,
    width: '100%',
  },
  stackBottomLeft: {
    maxWidth: 320,
    gap: Spacing.sm,
  },
  textSubtitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'left',
  },
});
