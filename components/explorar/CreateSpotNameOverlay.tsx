/**
 * CreateSpotNameOverlay — Paso 0 "Nombre del spot" (overlay sobre mapa).
 * Un solo input arriba; tap fuera cierra; botón "Continuar y ajustar ubicación" flotando abajo (estilo "Cómo llegar" sin icono).
 * Botón deshabilitado si no hay nombre. Barra siempre visible en la base.
 * zIndex lo define el padre (MapScreenVNext).
 */

import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CreateSpotNameOverlayProps = {
  visible: boolean;
  initialName?: string;
  onConfirm: (name: string) => void;
  onDismiss: () => void;
  /** Callback cuando el usuario escribe (para mostrar el nombre en el pin de preview). */
  onValueChange?: (value: string) => void;
};

const PANEL_ENTRANCE_OFFSET = 80;
const ENTRANCE_DURATION_MS = 320;

export function CreateSpotNameOverlay({
  visible,
  initialName,
  onConfirm,
  onDismiss,
  onValueChange,
}: CreateSpotNameOverlayProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [value, setValue] = useState("");
  const panelAnim = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /** Web: keyboard height via visualViewport (contrato KEYBOARD_AND_TEXT_INPUTS). */
  useEffect(() => {
    if (!visible || Platform.OS !== "web" || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () =>
      setKeyboardHeight(Math.max(0, window.innerHeight - vv.height));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [visible]);

  /** Native: keyboard height via Keyboard API. */
  useEffect(() => {
    if (!visible || Platform.OS === "web") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [visible]);

  useEffect(() => {
    if (visible) setValue(initialName?.trim() ?? "");
  }, [visible, initialName]);

  useEffect(() => {
    if (!visible) return;
    panelAnim.setValue(0);
    Animated.timing(panelAnim, {
      toValue: 1,
      duration: ENTRANCE_DURATION_MS,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, panelAnim]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") return;
    const root = document.documentElement;
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const supportsDvh =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("height", "100dvh");
    const setAppHeight = () => {
      if (supportsDvh) root.style.setProperty("--app-height", "100dvh");
      else if (vv) root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
      else if (typeof window !== "undefined")
        root.style.setProperty("--app-height", `${window.innerHeight}px`);
    };
    setAppHeight();
    if (!supportsDvh && vv) {
      vv.addEventListener("resize", setAppHeight);
      vv.addEventListener("scroll", setAppHeight);
    }
    return () => {
      if (!supportsDvh && vv) {
        vv.removeEventListener("resize", setAppHeight);
        vv.removeEventListener("scroll", setAppHeight);
      }
      root.style.removeProperty("--app-height");
    };
  }, [visible]);

  const trimmedName = value.trim();
  const hasName = trimmedName.length > 0;

  const handleConfirm = () => {
    if (!hasName) return;
    onConfirm(trimmedName);
  };

  const panelBg = colors.background;
  const panelBorder = colors.borderSubtle;
  const labelColor = colors.textSecondary;
  const inputBg = colors.background;
  const inputBorder = colors.borderSubtle;
  const inputColor = colors.text;
  const placeholderColor = colors.textSecondary;

  if (!visible) return null;

  const topMargin = Math.max(insets.top, Spacing.base) + Spacing.base;
  const sideMargin = Spacing.base;
  const barPaddingBottom = insets.bottom + Spacing.base;

  return (
    <View
      style={[
        styles.container,
        Platform.OS === "web" && styles.containerWeb,
        { pointerEvents: "auto" },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View
        style={[
          styles.panelWrap,
          { marginTop: topMargin, marginHorizontal: sideMargin },
          {
            opacity: panelAnim,
            transform: [
              {
                translateY: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-PANEL_ENTRANCE_OFFSET, 0],
                }),
              },
            ],
          },
          { pointerEvents: "box-none" },
        ]}
      >
        <View
          style={[
            styles.panel,
            {
              paddingTop: Spacing.lg,
              paddingHorizontal: Spacing.base,
              paddingBottom: Spacing.lg,
              backgroundColor: panelBg,
              borderColor: panelBorder,
            },
            Platform.OS === "web" && styles.panelShadow,
          ]}
        >
          <Text style={[styles.label, { color: labelColor }]}>
            Nombre del spot
          </Text>
          <TextInput
            value={value}
            onChangeText={(text) => {
              setValue(text);
              onValueChange?.(text);
            }}
            placeholder="Ej. Mirador, Playa Norte…"
            placeholderTextColor={placeholderColor}
            style={[
              styles.input,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: inputColor,
              },
            ]}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            accessibilityLabel="Nombre del spot"
          />
        </View>
      </Animated.View>
      <View
        style={[
          styles.continueBar,
          {
            bottom: keyboardHeight,
            paddingBottom: barPaddingBottom,
            paddingHorizontal: sideMargin,
          },
          { pointerEvents: "box-none" },
        ]}
      >
        <Pressable
          onPress={handleConfirm}
          disabled={!hasName}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: hasName ? colors.tint : colors.textSecondary,
              opacity: hasName ? (pressed ? 0.9 : 1) : 0.6,
            },
          ]}
          accessibilityLabel="Continuar y ajustar ubicación"
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasName }}
        >
          <Text style={styles.continueLabel}>Continuar y ajustar ubicación</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 16,
  },
  containerWeb:
    Platform.OS === "web"
      ? { height: "var(--app-height, 100dvh)" as unknown as number }
      : {},
  panelWrap: {
    alignSelf: "stretch",
  },
  panel: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  panelShadow:
    Platform.OS === "web"
      ? {
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24), 0 2px 8px rgba(0, 0, 0, 0.12)",
        }
      : {},
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    fontSize: 17,
  },
  continueBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButton: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  continueLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
