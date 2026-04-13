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
  accessibilityLabel?: string;
};

export function ExploreMapProfileButton({
  onPress,
  isAuthUser = false,
  avatarUri,
  accessibilityLabel = "Cuenta",
}: ExploreMapProfileButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const uri = avatarUri?.trim() ?? "";

  if (uri.length > 0) {
    return (
      <View style={styles.wrap} pointerEvents="box-none">
        <Pressable
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.avatarOuter,
            Shadow.subtle,
            {
              borderColor: pressed ? colors.primary : colors.borderSubtle,
              transform: [{ scale: pressed ? 0.98 : 1 }],
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
      <IconButton variant="default" onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <User
          size={24}
          color={isAuthUser ? colors.primary : colors.text}
          strokeWidth={2}
        />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
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
