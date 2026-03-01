import React from "react";
import { StyleSheet, View } from "react-native";

type CountriesMapPreviewProps = {
  countryCodes: string[];
  height?: number;
  highlightColor?: string;
  onSnapshotChange?: (dataUrl: string | null) => void;
};

export function CountriesMapPreview({ height = 120 }: CountriesMapPreviewProps) {
  return <View style={[styles.fallback, { height }]} />;
}

const styles = StyleSheet.create({
  fallback: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
});
