import { ImagePlus } from "lucide-react-native";
import React from "react";
import type { ViewStyle } from "react-native";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Radius, Spacing, WebTouchManipulation } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type SizePreset = "media" | "tile";

export type AddImageCtaProps = {
  /** Dispara picker/subida. */
  onPress: () => void;
  /**
   * Si false, solo renderiza el “look” (sin <button> en web).
   * Útil cuando el CTA vive dentro de un contenedor ya clickable (evita button>button).
   */
  interactive?: boolean;
  /** Spinner + texto “Subiendo…”, además deshabilita interacción. */
  busy?: boolean;
  /** Deshabilita interacción (además de busy). */
  disabled?: boolean;
  /** Texto cuando no está busy. */
  label?: string;
  /** Preset responsivo: media (slot de imagen en listas) o tile (grid/form). */
  size?: SizePreset;
  /** Tile: ancho/alto (si no se pasa, usa defaults por preset). */
  width?: number;
  height?: number;
  /** Colores opcionales (tile suele pasar primary/borde). */
  borderColor?: string;
  backgroundColor?: string;
  /** Accesibilidad. */
  accessibilityLabel?: string;
};

export function AddImageCta({
  onPress,
  interactive = true,
  busy = false,
  disabled = false,
  label = "Subir mis fotos",
  size = "media",
  width,
  height,
  borderColor,
  backgroundColor,
  accessibilityLabel = "Agregar imagen",
}: AddImageCtaProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const effectiveDisabled = disabled || busy;
  const text = busy ? "Subiendo mis fotos…" : label;
  const isTile = size === "tile";
  const resolvedBorder = borderColor ?? colors.borderSubtle;
  const resolvedBg = backgroundColor ?? colors.background;

  const webCursorStyle =
    Platform.OS === "web"
      ? ({ cursor: effectiveDisabled ? "auto" : "pointer" } as unknown as ViewStyle)
      : null;

  const sharedStyle = ({ pressed }: { pressed: boolean }): any => [
    styles.base,
    isTile ? styles.tile : styles.media,
    {
      borderColor: resolvedBorder,
      backgroundColor: resolvedBg,
      opacity: effectiveDisabled ? 0.7 : pressed ? 0.9 : 1,
      width: width ?? (isTile ? 120 : undefined),
      height: height ?? (isTile ? 120 : undefined),
    },
    WebTouchManipulation,
    webCursorStyle,
  ];

  const content = (
    <>
      {busy ? (
        <ActivityIndicator size="small" color={isTile ? colors.primary : colors.textSecondary} />
      ) : (
        <ImagePlus
          size={isTile ? 22 : 18}
          color={isTile ? colors.primary : colors.textSecondary}
          strokeWidth={isTile ? 2.4 : 2}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: isTile ? colors.primary : colors.textSecondary },
          isTile ? styles.labelTile : styles.labelMedia,
        ]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </>
  );

  if (!interactive) {
    return (
      <View
        accessibilityRole="text"
        style={sharedStyle({ pressed: false })}
        pointerEvents="none"
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={effectiveDisabled}
      onPress={() => onPress()}
      style={({ pressed }) => sharedStyle({ pressed })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 0,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tile: {
    borderWidth: 1,
    borderStyle: "dashed",
    minWidth: 96,
    minHeight: 96,
    borderRadius: Radius.sm,
    gap: 6,
    paddingHorizontal: 6,
  },
  label: {
    textAlign: "center",
    fontWeight: "600",
  },
  labelMedia: {
    fontSize: 11,
    lineHeight: 13,
  },
  labelTile: {
    fontSize: 12,
    lineHeight: 14,
  },
});

