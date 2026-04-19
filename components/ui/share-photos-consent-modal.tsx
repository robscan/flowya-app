import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TypographyStyles } from "@/components/design-system/typography";
import { Colors, Radius, Spacing, WebTouchManipulation } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type SharePhotosConsentChoice = boolean;

export function SharePhotosConsentModal({
  visible,
  busy = false,
  onChoose,
  onCancel,
}: {
  visible: boolean;
  busy?: boolean;
  onChoose: (choice: SharePhotosConsentChoice) => void | Promise<void>;
  onCancel: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityLabel="Cerrar"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.centered}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.backgroundElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[TypographyStyles.heading2, { color: colors.text }]}>
              ¿Compartir tus fotos con el mundo?
            </Text>

            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Si eliges <Text style={{ color: colors.text, fontWeight: "700" }}>Compartir</Text>, tus
              fotos podrán verse por otras personas. Si eliges{" "}
              <Text style={{ color: colors.text, fontWeight: "700" }}>Solo para mí</Text>, se
              guardarán como privadas y solo tú las verás.
            </Text>

            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.footer}>
              <View style={styles.inlineRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.choiceButton,
                    {
                      borderColor: colors.border,
                      backgroundColor:
                        pressed && !busy ? colors.backgroundElevated : "transparent",
                      opacity: busy ? 0.6 : 1,
                    },
                    WebTouchManipulation,
                  ]}
                  onPress={() => void onChoose(true)}
                  disabled={busy}
                  accessibilityLabel="Compartir"
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <Text style={[styles.choiceLabel, { color: colors.text }]}>Compartir</Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.choiceButton,
                    {
                      borderColor: colors.border,
                      backgroundColor:
                        pressed && !busy ? colors.backgroundElevated : "transparent",
                      opacity: busy ? 0.6 : 1,
                    },
                    WebTouchManipulation,
                  ]}
                  onPress={() => void onChoose(false)}
                  disabled={busy}
                  accessibilityLabel="Solo para mí"
                >
                  <Text style={[styles.choiceLabel, { color: colors.text }]}>Solo para mí</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={onCancel}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Ahora no"
                style={({ pressed }) => [
                  styles.tertiaryLink,
                  { opacity: busy ? 0.5 : pressed ? 0.7 : 1 },
                  WebTouchManipulation,
                ]}
              >
                <Text style={[styles.tertiaryLinkText, { color: colors.textSecondary }]}>
                  Ahora no
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  centered: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.base,
  },
  footer: {
    gap: Spacing.sm,
  },
  inlineRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  choiceButton: {
    flex: 1,
    borderRadius: Radius.lg,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderWidth: 1,
  },
  choiceLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  tertiaryLink: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tertiaryLinkText: {
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

