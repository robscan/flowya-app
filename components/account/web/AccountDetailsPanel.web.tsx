import { TypographyStyles } from "@/components/design-system/typography";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { Colors, Spacing } from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { yieldToPaint } from "@/lib/async/yield-to-paint";
import {
  buildProfileAvatarDisplayUrl,
  bumpProfileAvatarDisplayBust,
  deleteMyProfileAvatarObject,
  getProfileAvatarDisplayBustSnapshot,
  pickProfileImageBlob,
  resetProfileAvatarDisplayBust,
  subscribeProfileAvatarDisplayBust,
  uploadMyProfileAvatar,
} from "@/lib/profile-avatar-upload";
import { fetchMyProfile, updateMyProfile, type ProfileRow } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { ImagePlus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const AVATAR_SIZE = 132;

export function AccountDetailsPanelWeb() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();

  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user || user.is_anonymous) {
      resetProfileAvatarDisplayBust();
      setSessionReady(false);
      setProfile(null);
      setUserEmail(null);
      setLoading(false);
      return;
    }
    setSessionReady(true);
    setUserEmail(user.email ?? null);
    const { data, error } = await fetchMyProfile();
    if (error) {
      toast.show(error.message, { type: "error" });
      setProfile(null);
    } else {
      setProfile(data);
      setDisplayName(data?.display_name?.trim() ?? "");
    }
    setLoading(false);
  }, [toast.show]);

  useEffect(() => {
    void load();
  }, [load]);

  const accountEmail = profile?.email?.trim() || userEmail;
  const trimmedDisplay = displayName.trim();
  const savedDisplay = profile?.display_name?.trim() ?? "";
  const nameDirty = sessionReady && trimmedDisplay !== savedDisplay;

  const onSaveName = useCallback(async () => {
    if (!sessionReady || !nameDirty) return;
    setSavingName(true);
    const { data, error } = await updateMyProfile({
      display_name: trimmedDisplay.length > 0 ? trimmedDisplay : null,
    });
    setSavingName(false);
    if (error) {
      toast.show(error.message, { type: "error" });
      return;
    }
    setProfile(data);
    toast.show("Nombre guardado", { type: "success", replaceVisible: true });
  }, [sessionReady, nameDirty, trimmedDisplay, toast]);

  const profileAvatarUriBust = useSyncExternalStore(
    subscribeProfileAvatarDisplayBust,
    getProfileAvatarDisplayBustSnapshot,
    getProfileAvatarDisplayBustSnapshot,
  );
  const avatarPublicUrl = useMemo(
    () => buildProfileAvatarDisplayUrl(profile?.avatar_storage_path ?? null, profileAvatarUriBust),
    [profile?.avatar_storage_path, profileAvatarUriBust],
  );

  const onPickAvatar = useCallback(async () => {
    if (!sessionReady || avatarBusy) return;
    setAvatarBusy(true);
    await yieldToPaint();
    try {
      const blob = await pickProfileImageBlob();
      if (!blob) return;
      await yieldToPaint();
      const uploaded = await uploadMyProfileAvatar(blob);
      if (!uploaded) {
        toast.show("No se pudo subir la imagen.", { type: "error" });
        return;
      }
      const { data, error } = await updateMyProfile({
        avatar_storage_path: uploaded.storagePath,
      });
      if (error) {
        toast.show(error.message, { type: "error" });
        return;
      }
      let next = data;
      if (!next) {
        const r = await fetchMyProfile();
        next = r.data;
      }
      setProfile(next);
      bumpProfileAvatarDisplayBust();
      toast.show("Foto actualizada", { type: "success", replaceVisible: true });
    } catch {
      toast.show("No se pudo completar la selección de imagen.", { type: "error" });
    } finally {
      setAvatarBusy(false);
    }
  }, [sessionReady, avatarBusy, toast.show]);

  const onRemoveAvatar = useCallback(async () => {
    if (!sessionReady || avatarBusy || !profile?.avatar_storage_path) return;
    setAvatarBusy(true);
    const previousAvatarPath = profile.avatar_storage_path;
    try {
      const { data, error } = await updateMyProfile({ avatar_storage_path: null });
      if (error) {
        toast.show(error.message, { type: "error" });
        return;
      }
      let next = data;
      if (!next) {
        const r = await fetchMyProfile();
        next = r.data;
      }
      setProfile(next);
      bumpProfileAvatarDisplayBust();
      const deleted = await deleteMyProfileAvatarObject(previousAvatarPath);
      if (!deleted) {
        toast.show("Foto quitada, pero no se pudo limpiar el archivo anterior.", { type: "default" });
        return;
      }
      toast.show("Foto eliminada", { type: "error", replaceVisible: true });
    } finally {
      setAvatarBusy(false);
    }
  }, [sessionReady, avatarBusy, profile?.avatar_storage_path, toast.show]);

  if (loading) {
    return (
      <View style={{ width: "100%", paddingVertical: 40, alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return !sessionReady ? (
    <View style={{ width: "100%" }}>
      <Text style={[TypographyStyles.body, { color: colors.textSecondary }]}>
        Inicia sesión para ver y editar tu cuenta.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          openAuthModal({
            message: AUTH_MODAL_MESSAGES.profile,
            onSuccess: () => void load(),
          })
        }
        style={({ pressed }) => ({
          marginTop: Spacing.lg,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
          backgroundColor: colors.primary,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={[TypographyStyles.body, { fontWeight: "700", color: "#fff" }]}>Iniciar sesión</Text>
      </Pressable>
    </View>
  ) : (
    <View style={{ width: "100%", gap: Spacing.lg }}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={avatarPublicUrl ? "Cambiar foto de perfil" : "Subir foto de perfil"}
          disabled={avatarBusy}
          onPress={() => void onPickAvatar()}
          style={({ pressed }) => ({
            position: "relative",
            opacity: avatarBusy ? 0.75 : pressed ? 0.92 : 1,
          })}
        >
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarPublicUrl ? (
              <Image source={{ uri: avatarPublicUrl }} style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} />
            ) : (
              <Text style={[TypographyStyles.heading2, { color: colors.textSecondary, fontSize: 44 }]}>
                {(trimmedDisplay || accountEmail || "?").charAt(0).toUpperCase()}
              </Text>
            )}
            {avatarBusy ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: "rgba(0,0,0,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  },
                ]}
                pointerEvents="none"
              >
                <ActivityIndicator color="#fff" />
                <Text style={[TypographyStyles.caption, { color: "#fff", fontWeight: "600" }]}>Subiendo…</Text>
              </View>
            ) : null}
          </View>
          <View
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: colors.background,
              backgroundColor: colors.primary,
            }}
          >
            {avatarBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ImagePlus size={20} color="#fff" strokeWidth={2.25} />
            )}
          </View>
        </Pressable>
        {avatarPublicUrl ? (
          <Pressable
            accessibilityRole="button"
            disabled={avatarBusy}
            onPress={() => void onRemoveAvatar()}
            style={({ pressed }) => ({ marginTop: Spacing.sm, opacity: pressed || avatarBusy ? 0.65 : 1 })}
          >
            <Text style={[TypographyStyles.caption, { color: colors.textSecondary, textAlign: "center" }]}>
              Eliminar foto
            </Text>
          </Pressable>
        ) : null}
      </View>

      {accountEmail ? (
        <View
          style={{
            width: "100%",
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.sm,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
            Correo electrónico
          </Text>
          <Text style={[TypographyStyles.body, { color: colors.text }]}>{accountEmail}</Text>
        </View>
      ) : null}

      <View style={{ width: "100%" }}>
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
          Nombre visible
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ej. Alex"
          placeholderTextColor={colors.textSecondary}
          style={{
            borderWidth: 1,
            borderRadius: 14,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            fontSize: 16,
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.backgroundElevated,
          }}
          autoCapitalize="words"
          autoCorrect
          accessibilityLabel="Nombre visible"
        />
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 }]}>
          Es cómo te mostramos en la app.
        </Text>
      </View>

      {nameDirty ? (
        <Pressable
          accessibilityRole="button"
          disabled={savingName}
          onPress={() => void onSaveName()}
          style={({ pressed }) => ({
            width: "100%",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            minHeight: 48,
            backgroundColor: colors.primary,
            opacity: savingName || pressed ? 0.85 : 1,
          })}
        >
          {savingName ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[TypographyStyles.body, { fontWeight: "700", color: "#fff" }]}>Guardar nombre</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
