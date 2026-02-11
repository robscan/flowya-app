/**
 * Search V2: input canónico con clear "X" integrado (sin rectángulo/fondo blanco).
 * Threshold 3 chars se aplica en el controller; este componente solo muestra valor y clear.
 */

import { X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
    Colors,
    Radius,
    Spacing,
    WebTouchManipulation,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type SearchInputV2Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
  accessibilityLabel?: string;
  /** Cuando true, el input no tiene borde ni fondo (para usar dentro de un pill). */
  embedded?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function SearchInputV2({
  value,
  onChangeText,
  onClear,
  placeholder = "Buscar lugares…",
  autoFocus = false,
  editable = true,
  accessibilityLabel = "Buscar",
  embedded = false,
  onFocus,
  onBlur,
}: SearchInputV2Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const clearVisible = value.length > 0;

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: embedded
              ? "transparent"
              : colors.backgroundElevated,
            borderColor: embedded ? "transparent" : colors.borderSubtle,
            color: colors.text,
            paddingRight: clearVisible ? 44 : Spacing.base,
          },
          embedded && styles.inputEmbedded,
          WebTouchManipulation,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        clearButtonMode="never"
        selectionColor="transparent"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {clearVisible ? (
        <Pressable
          style={[styles.clearButton]}
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Limpiar búsqueda"
          accessibilityRole="button"
          {...WebTouchManipulation}
        >
          <X size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  wrapEmbedded: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 0,
    fontSize: 16,
  },
  inputEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    paddingLeft: 0,
  },
  /** Clear integrado: sin caja ni backgroundColor propio; solo ícono sobre el input. */
  clearButton: {
    position: "absolute",
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    backgroundColor: "transparent",
  },
});
