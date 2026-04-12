import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Shadow, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Tiempo por defecto para leer el mensaje; tap en el toast lo cierra antes. */
const SYSTEM_STATUS_DURATION_MS = 4800;
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

/** Evita re-renders por floats casi iguales (sheetHeight, layout) que mueven el toast un px. */
function roundAnchorPx(a: SystemStatusAnchor): SystemStatusAnchor {
  const r = (n: number | undefined) =>
    n === undefined ? undefined : Math.round(n);
  return {
    placement: a.placement,
    ...(a.top !== undefined ? { top: r(a.top) } : {}),
    ...(a.bottom !== undefined ? { bottom: r(a.bottom) } : {}),
    ...(a.left !== undefined ? { left: r(a.left) } : {}),
    ...(a.right !== undefined ? { right: r(a.right) } : {}),
  };
}

function anchorsEqual(a: SystemStatusAnchor, b: SystemStatusAnchor): boolean {
  return (
    a.placement === b.placement &&
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.right === b.right
  );
}

export type SystemStatusType = 'success' | 'default' | 'error';

type SystemStatusMessage = {
  id: number;
  text: string;
  type: SystemStatusType;
};

export type SystemStatusShowOptions = {
  type?: SystemStatusType;
  /** replaceVisible=true: útil para mensajes de filtro que no deben apilarse. */
  replaceVisible?: boolean;
  /** Duración visible antes del cierre automático (ms). Por defecto ~4,8 s. */
  durationMs?: number;
};

type SystemStatusContextValue = {
  show: (message: string, options?: SystemStatusShowOptions) => void;
  setAnchor: (anchor: SystemStatusAnchor) => void;
  resetAnchor: () => void;
  hasVisibleMessages: boolean;
};

const SystemStatusContext = createContext<SystemStatusContextValue | null>(null);

export function useSystemStatus(): SystemStatusContextValue {
  const ctx = useContext(SystemStatusContext);
  if (!ctx) throw new Error('useSystemStatus must be used within SystemStatusProvider');
  return ctx;
}

/**
 * Máximo contraste: invertido respecto al tema de la app.
 * Dark mode UI → toast blanco / texto negro. Light mode UI → toast oscuro / texto blanco.
 */
function resolveToastPalette(mode: 'light' | 'dark'): {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
} {
  if (mode === 'dark') {
    return {
      textColor: '#000000',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(0,0,0,0.12)',
    };
  }
  return {
    textColor: '#ffffff',
    backgroundColor: 'rgba(29,29,31,0.96)',
    borderColor: 'rgba(255,255,255,0.18)',
  };
}

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<SystemStatusMessage[]>([]);
  const [anchor, setAnchorState] = useState<SystemStatusAnchor>(() =>
    roundAnchorPx({
      placement: 'top-center',
      top: Platform.select({ web: DEFAULT_TOP_WEB, default: DEFAULT_TOP_NATIVE }),
    }),
  );
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

  const dismiss = useCallback(() => {
    clearTimer();
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      setMessages([]);
    });
  }, [clearTimer, opacity]);

  const show = useCallback(
    (message: string, options?: SystemStatusShowOptions) => {
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
      const durationMs = options?.durationMs ?? SYSTEM_STATUS_DURATION_MS;
      timeoutRef.current = setTimeout(() => {
        dismiss();
        timeoutRef.current = null;
      }, durationMs);
    },
    [clearTimer, dismiss, opacity],
  );

  const setAnchor = useCallback((nextAnchor: SystemStatusAnchor) => {
    const next = roundAnchorPx(nextAnchor);
    setAnchorState((prev) => (anchorsEqual(prev, next) ? prev : next));
  }, []);

  const resetAnchor = useCallback(() => {
    setAnchorState(
      roundAnchorPx({
        placement: 'top-center',
        top: Platform.select({ web: DEFAULT_TOP_WEB, default: DEFAULT_TOP_NATIVE }),
      }),
    );
  }, []);

  const contextValue = useMemo(
    () => ({ show, setAnchor, resetAnchor, hasVisibleMessages: messages.length > 0 }),
    [show, setAnchor, resetAnchor, messages.length],
  );
  const resolvedMode: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';
  const activePalette = resolveToastPalette(resolvedMode);

  /**
   * Web + bottom-left: `fixed` respecto al viewport. Si es `absolute` dentro del flex raíz,
   * cualquier reflow del mapa/sidebar puede desplazar el contenedor y el toast «salta».
   */
  const overlayPositionStyle =
    anchor.placement === 'bottom-left'
      ? ({
          position: Platform.OS === 'web' ? ('fixed' as const) : ('absolute' as const),
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
          <Animated.View style={[styles.overlay, overlayPositionStyle, { opacity, pointerEvents: 'box-none' }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar notificación"
              accessibilityHint="Toca para ocultar el mensaje"
              onPress={dismiss}
              style={({ pressed }) => [
                styles.stack,
                WebTouchManipulation,
                {
                  backgroundColor: activePalette.backgroundColor,
                  borderColor: activePalette.borderColor,
                  opacity: pressed ? 0.92 : 1,
                },
                anchor.placement === 'bottom-left' ? styles.stackBottomLeft : styles.stackTopCenter,
                Platform.OS === 'web' && { cursor: 'pointer' as const },
              ]}
            >
              <View accessibilityLiveRegion="polite">
                {messages.map((message) => (
                  <Text
                    key={message.id}
                    style={[styles.textSubtitle, { color: activePalette.textColor }]}
                    numberOfLines={5}
                  >
                    {message.text}
                  </Text>
                ))}
              </View>
            </Pressable>
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Shadow.card,
  },
  stackTopCenter: {
    maxWidth: 440,
    width: '100%',
    /** Overlay con `alignItems: 'center'`: sin `stretch` el ancho colapsa y el texto se corta con `…`. */
    alignSelf: 'stretch',
  },
  stackBottomLeft: {
    maxWidth: 320,
    gap: Spacing.sm,
  },
  textSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'left',
    flexShrink: 1,
  },
});
