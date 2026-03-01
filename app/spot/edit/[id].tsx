/**
 * EditSpotScreen — Full-screen edit for spot texts.
 * No modal. Keyboard handled via ScrollView.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { IconButton } from "@/components/design-system/icon-button";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

type SpotEdit = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
};

export default function EditSpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spot, setSpot] = useState<SpotEdit | null>(null);
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("spots")
        .select("id, title, description_short, description_long")
        .eq("id", id)
        .eq("is_hidden", false)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        setSpot(null);
        return;
      }
      const s = data as SpotEdit;
      setSpot(s);
      setTitle(s.title);
      setShortDesc(s.description_short ?? "");
      setLongDesc(s.description_long ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!spot?.id || !title.trim()) {
      toast.show("Necesitamos un título para el spot", { type: "error" });
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.profile });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("spots")
      .update({
        title: title.trim(),
        description_short: shortDesc.trim() || null,
        description_long: longDesc.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", spot.id);
    setSaving(false);
    if (error) {
      toast.show(error.message ?? "No se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
      return;
    }
    toast.show("Cambios guardados correctamente", { type: "success" });
    router.back();
  }, [spot?.id, title, shortDesc, longDesc, toast, openAuthModal, router]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando…
        </Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Spot no encontrado
        </Text>
        <Pressable
          onPress={handleBack}
          style={[styles.backLink, { marginTop: Spacing.base }]}
        >
          <Text style={{ color: colors.primary }}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <IconButton
          variant="default"
          onPress={handleBack}
          accessibilityLabel="Volver"
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </IconButton>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Editar spot
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
        >
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Título *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElevated,
                  borderColor: colors.borderSubtle,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Nombre del lugar"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Descripción corta
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.inputMultiline,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElevated,
                  borderColor: colors.borderSubtle,
                },
              ]}
              value={shortDesc}
              onChangeText={setShortDesc}
              placeholder="Breve descripción"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Descripción larga
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.inputMultiline,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElevated,
                  borderColor: colors.borderSubtle,
                },
              ]}
              value={longDesc}
              onChangeText={setLongDesc}
              placeholder="Descripción detallada"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
            />
          </View>
          <Pressable
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                opacity: saving ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Guardar cambios"
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.base,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
  },
  backLink: {
    padding: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
