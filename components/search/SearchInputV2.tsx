/**
 * Search V2: input canónico con clear "X" integrado (sin rectángulo/fondo blanco).
 * Threshold 3 chars se aplica en el controller; este componente solo muestra valor y clear.
 */

import React, { forwardRef } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import {
    Colors,
    Radius,
    Spacing,
    WebTouchManipulation,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ClearIconCircle } from "@/components/design-system/clear-icon-circle";

export type SearchInputV2Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  /** Si se omite, usa `textSecondary` del tema. */
  placeholderTextColor?: string;
  autoFocus?: boolean;
  editable?: boolean;
  accessibilityLabel?: string;
  /** Cuando true, el input no tiene borde ni fondo (para usar dentro de un pill). */
  embedded?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCorrect?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export const SearchInputV2 = forwardRef<TextInput, SearchInputV2Props>(function SearchInputV2(
  {
    value,
    onChangeText,
    onClear,
    placeholder = "Busca: países, regiones o lugares",
    placeholderTextColor: placeholderTextColorProp,
    autoFocus = false,
    editable = true,
    accessibilityLabel = "Buscar",
    embedded = false,
    onFocus,
    onBlur,
    autoCorrect,
    autoCapitalize,
  },
  ref
) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const placeholderTextColor = placeholderTextColorProp ?? colors.textSecondary;
  const clearVisible = value.length > 0;

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded] as StyleProp<ViewStyle>}>
      <TextInput
        ref={ref}
        style={
          [
            styles.input,
            {
              backgroundColor: embedded
                ? "transparent"
                : colors.backgroundElevated,
              borderColor: embedded ? "transparent" : colors.borderSubtle,
              color: colors.text,
              paddingRight: clearVisible ? 34 : Spacing.base,
            },
            embedded && styles.inputEmbedded,
            WebTouchManipulation as unknown as TextStyle,
            Platform.OS === 'web' && styles.inputFocusHidden,
          ] as StyleProp<TextStyle>
        }
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        clearButtonMode="never"
        selectionColor="transparent"
        onFocus={onFocus}
        onBlur={onBlur}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
      />
      {clearVisible ? (
        <View style={styles.clearWrap as StyleProp<ViewStyle>}>
          <ClearIconCircle
            onPress={onClear}
            accessibilityLabel="Limpiar búsqueda"
            iconColor={colors.textSecondary}
          />
        </View>
      ) : null}
    </View>
  );
});

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
  /** Web: ocultar outline/border de focus (evita el borde naranja). */
  inputFocusHidden: {
    outlineWidth: 0,
  } as TextStyle,
  clearWrap: {
    position: "absolute",
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
});
