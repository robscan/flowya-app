import { AlignJustify, List, Rows3 } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Colors, Radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { ExploreListDensity } from "@/lib/storage/exploreListDensityPreference";

export type { ExploreListDensity };

export type ExploreListDensityControlProps = {
  value: ExploreListDensity;
  onChange: (value: ExploreListDensity) => void;
  disabled?: boolean;
  context?: "all" | "to_visit" | "visited";
};

const OPTIONS: {
  value: ExploreListDensity;
  label: string;
  Icon: typeof AlignJustify;
}[] = [
  { value: "detail", label: "Vista detallada", Icon: Rows3 },
  { value: "compact", label: "Vista compacta", Icon: AlignJustify },
  { value: "simple", label: "Vista simple", Icon: List },
];

export function ExploreListDensityControl({
  value,
  onChange,
  disabled = false,
  context = "all",
}: ExploreListDensityControlProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const surface =
    context === "to_visit"
      ? {
          background: colors.countriesPanelToVisitBackgroundElevated,
          border: colors.countriesPanelToVisitBorder,
          selected: colors.countriesPanelToVisitBorderSubtle,
        }
      : context === "visited"
        ? {
            background: colors.countriesPanelVisitedBackgroundElevated,
            border: colors.countriesPanelVisitedBorder,
            selected: colors.countriesPanelVisitedBorderSubtle,
          }
        : {
            background: colors.backgroundElevated,
            border: colors.borderSubtle,
            selected: colors.stateSurfaceHover,
          };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: surface.background,
          borderColor: surface.border,
        },
      ]}
      accessibilityRole="toolbar"
      accessibilityLabel="Densidad de lista"
    >
      {OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const selected = optionValue === value;
        return (
          <Pressable
            key={optionValue}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(optionValue)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: selected
                  ? surface.selected
                  : pressed && !disabled
                    ? colors.stateSurfacePressed
                    : "transparent",
                opacity: disabled ? 0.5 : 1,
              },
              Platform.OS === "web" && !disabled ? ({ cursor: "pointer" } as any) : null,
            ]}
          >
            <Icon
              size={15}
              color={selected ? colors.text : colors.textSecondary}
              strokeWidth={selected ? 2.4 : 2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.pill,
    padding: 3,
    gap: 2,
    flexShrink: 0,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
