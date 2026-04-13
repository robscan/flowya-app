import React from "react";
import { StyleSheet, View } from "react-native";

import { Radius, Shadow } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { SearchLauncherField } from "./search-launcher-field";

export type ExploreChromeSearchFieldProps = {
  onSearchPress: () => void;
  searchPlaceholder?: string;
  accessibilityLabel?: string;
  /** Sin tope de ancho (520px): sheet de Explorar, o mapa en Por visitar/Visitados dentro del host `WEB_SHEET_MAX_WIDTH`. */
  fullWidth?: boolean;
};

/**
 * **Canon** de entrada a búsqueda en el chrome de Explorar (mapa, welcome móvil, welcome desktop/sidebar, banda KPI).
 * Solo `SearchLauncherField` (variant `onMap`) dentro de la pastilla; sin perfil — el perfil es `ExploreMapProfileButton` aparte.
 *
 * Ver `docs/contracts/EXPLORE_CHROME_SHELL.md`.
 */
export function ExploreChromeSearchField({
  onSearchPress,
  searchPlaceholder,
  accessibilityLabel,
  fullWidth = false,
}: ExploreChromeSearchFieldProps) {
  const colorScheme = useColorScheme();
  const isDark = (colorScheme ?? "light") === "dark";
  const containerBackground = isDark ? "rgba(0, 0, 0, 0.42)" : "rgba(255, 255, 255, 0.88)";
  const containerBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  return (
    <View
      style={[
        styles.row,
        !fullWidth && styles.rowCappedWidth,
        !fullWidth && styles.rowCappedAlign,
        {
          backgroundColor: containerBackground,
          borderColor: containerBorder,
        },
      ]}
    >
      <SearchLauncherField
        onPress={onSearchPress}
        placeholder={searchPlaceholder}
        accessibilityLabel={accessibilityLabel}
        variant="onMap"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    padding: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    ...Shadow.subtle,
  },
  rowCappedWidth: {
    maxWidth: 520,
  },
  /** Con ancho capado (Todos / mapa): centrar como la banda KPI (WR-01). */
  rowCappedAlign: {
    alignSelf: "center",
  },
});
