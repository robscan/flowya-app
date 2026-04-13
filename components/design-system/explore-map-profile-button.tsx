/**
 * Botón de cuenta en esquina superior del mapa (Explorar).
 * Separado de ExploreSearchActionRow (solo búsqueda).
 */

import { IconButton } from "@/components/design-system/icon-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { User } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

export type ExploreMapProfileButtonProps = {
  onPress: () => void;
  isAuthUser?: boolean;
  accessibilityLabel?: string;
};

export function ExploreMapProfileButton({
  onPress,
  isAuthUser = false,
  accessibilityLabel = "Cuenta",
}: ExploreMapProfileButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
});
