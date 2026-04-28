import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type NativeSheetShellProps = {
  visible: boolean;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  keyboardAvoiding?: boolean;
  contentStyle?: ViewStyle;
};

export function NativeSheetShell({
  visible,
  closeLabel,
  onClose,
  children,
  keyboardAvoiding = false,
  contentStyle,
}: NativeSheetShellProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const content = (
    <>
      <Pressable
        accessibilityLabel={closeLabel}
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.backgroundElevated,
            paddingBottom: insets.bottom + Spacing.lg,
            borderColor: palette.border,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </>
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.root}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.root}>{content}</View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
});
