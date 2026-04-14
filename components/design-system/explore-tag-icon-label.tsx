/**
 * Icono Tag (canon explorar) + nombre de etiqueta, sin prefijo "#".
 */

import { Tag } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export type ExploreTagIconLabelProps = {
  name: string;
  /** Ej. " (3)" en chips de filtro con conteo */
  suffix?: string;
  /** Color del glifo Tag (y del texto si `textStyle` no define `color`). */
  color: string;
  iconSize?: number;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  containerStyle?: StyleProp<ViewStyle>;
  gap?: number;
};

export function ExploreTagIconLabel({
  name,
  suffix = "",
  color,
  iconSize = 12,
  textStyle,
  numberOfLines = 1,
  containerStyle,
  gap = 4,
}: ExploreTagIconLabelProps) {
  return (
    <View style={[styles.row, { gap }, containerStyle]}>
      <View
        pointerEvents="none"
        style={styles.iconWrap}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Tag size={iconSize} color={color} strokeWidth={2.2} />
      </View>
      <Text
        style={[styles.labelShrink, textStyle ?? { color }]}
        numberOfLines={numberOfLines}
      >
        {name}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  iconWrap: {
    flexShrink: 0,
  },
  labelShrink: {
    flexShrink: 1,
    minWidth: 0,
  },
});
