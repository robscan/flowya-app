import { TypographyStyles } from "@/components/design-system/typography";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { Colors, Spacing } from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchMyProfile, updateMyProfile, type ProfileRow } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function AccountPrivacyPanelWeb() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();

  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user || user.is_anonymous) {
      setSessionReady(false);
      setProfile(null);
      setLoading(false);
      return;
    }
    setSessionReady(true);
    const { data, error } = await fetchMyProfile();
    if (error) {
      toast.show(error.message, { type: "error" });
      setProfile(null);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const shareWithWorld = profile?.share_photos_with_world;
  const shareWithWorldLabel =
    shareWithWorld === true ? "Activado" : shareWithWorld === false ? "Desactivado" : "Sin definir";
  const shareWithWorldHint =
    shareWithWorld === false
      ? "Tus fotos se guardan como privadas. Puedes activarlo para contribuir fotos públicas."
      : "Tus fotos pueden verse por otros en la plataforma.";

  const onToggle = useCallback(async () => {
    if (!sessionReady || busy) return;
    const next = !(profile?.share_photos_with_world === true);
    setBusy(true);
    const { data, error } = await updateMyProfile({ share_photos_with_world: next });
    setBusy(false);
    if (error) {
      toast.show(error.message, { type: "error" });
      return;
    }
    setProfile(data);
    toast.show(next ? "Compartir fotos: activado" : "Compartir fotos: desactivado", {
      type: "success",
      replaceVisible: true,
    });
  }, [sessionReady, busy, profile?.share_photos_with_world, toast]);

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
    <View style={{ width: "100%", gap: Spacing.md }}>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void onToggle()}
        style={({ pressed }) => ({
          width: "100%",
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.base,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.backgroundElevated,
          opacity: busy ? 0.7 : pressed ? 0.9 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={[TypographyStyles.body, { color: colors.text, fontWeight: "700" }]}>
              Compartir mis fotos con el mundo
            </Text>
            <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              Estado: {shareWithWorldLabel}
            </Text>
          </View>
          <View
            style={{
              minWidth: 56,
              height: 34,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 12,
              backgroundColor: shareWithWorld === true ? colors.stateSuccess : colors.borderSubtle,
            }}
          >
            {busy ? (
              <ActivityIndicator color={shareWithWorld === true ? "#fff" : colors.text} />
            ) : (
              <Text style={{ color: shareWithWorld === true ? "#fff" : colors.text, fontWeight: "800" }}>
                {shareWithWorld === true ? "ON" : "OFF"}
              </Text>
            )}
          </View>
        </View>
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 }]}>
          {shareWithWorldHint}
        </Text>
      </Pressable>
    </View>
  );
}
