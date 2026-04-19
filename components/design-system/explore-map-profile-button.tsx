/**
 * Botón de cuenta en esquina superior del mapa (Explorar).
 * Separado de `ExploreChromeSearchField` (solo búsqueda en mapa/sidebar).
 */

import { IconButton } from "@/components/design-system/icon-button";
import { Colors, Shadow } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { User } from "lucide-react-native";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

const BTN_SIZE = 44;

export type ExploreMapProfileButtonProps = {
  onPress: () => void;
  isAuthUser?: boolean;
  /** URL pública del avatar (Storage); si no hay, icono `User`. */
  avatarUri?: string | null;
  /** Mientras navega/abre cuenta: deshabilita y muestra estado seleccionado. */
  busy?: boolean;
  /** Estado seleccionado (p. ej. cuando la ruta actual es /account). */
  selected?: boolean;
  accessibilityLabel?: string;
};

export function ExploreMapProfileButton({
  onPress,
  isAuthUser = false,
  avatarUri,
  busy = false,
  selected = false,
  accessibilityLabel = "Cuenta",
}: ExploreMapProfileButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const uri = avatarUri?.trim() ?? "";
  const active = busy || selected;

  if (uri.length > 0) {
    return (
      <View style={styles.wrap} pointerEvents="box-none">
        <Pressable
          onPress={onPress}
          disabled={busy}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ selected, disabled: busy }}
          style={({ pressed }) => [
            styles.avatarOuter,
            Shadow.subtle,
            {
              borderColor: active || pressed ? colors.primary : colors.borderSubtle,
              backgroundColor: active ? colors.backgroundElevated : "transparent",
              transform: [{ scale: active ? 1.08 : pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Image
            source={{ uri }}
            style={styles.avatarImage}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[active && styles.iconBusyWrap]}>
        <IconButton
          variant="default"
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          disabled={busy}
        >
        <User
          size={24}
          color={active || isAuthUser ? colors.primary : colors.text}
          strokeWidth={2}
        />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
  iconBusyWrap: {
    transform: [{ scale: 1.06 }],
  },
  avatarOuter: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarImage: {
    width: BTN_SIZE,
    height: BTN_SIZE,
  },
});
