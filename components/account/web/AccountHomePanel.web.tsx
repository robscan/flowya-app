/**
 * Cuerpo de la home de perfil (web). Compartido por la ruta `/account` (móvil / web estrecho)
 * y por el panel embebido en Explore desktop (`?account=profile`).
 */

import { CountriesSheetKpiRow } from "@/components/design-system/countries-sheet-kpi-row";
import { CountriesSheetVisitedProgress } from "@/components/design-system/countries-sheet-visited-progress";
import { TravelerLevelsModal } from "@/components/design-system/traveler-levels-modal";
import { TypographyStyles } from "@/components/design-system/typography";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { useProfileKpis } from "@/hooks/use-profile-kpis";
import { yieldToPaint } from "@/lib/async/yield-to-paint";
import { blurActiveElement } from "@/lib/focus-management";
import { ACCOUNT_DESKTOP_QUERY_KEY } from "@/lib/explore/account-desktop-query";
import { markExploreOpenCountriesSheetOnce } from "@/lib/explore/entry-intents";
import {
  clearCountriesShareVisitedSession,
  shareVisitedCountriesProgress,
} from "@/lib/explore/visited-countries-share";
import {
  buildProfileAvatarDisplayUrl,
  bumpProfileAvatarDisplayBust,
  getProfileAvatarDisplayBustSnapshot,
  pickProfileImageBlob,
  resetProfileAvatarDisplayBust,
  subscribeProfileAvatarDisplayBust,
  uploadMyProfileAvatar,
} from "@/lib/profile-avatar-upload";
import { fetchMyProfile, touchMyProfileLastActivity, updateMyProfile, type ProfileRow } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const AVATAR_HOME = 88;

type SessionPhase = "booting" | "guest" | "user";

export function AccountHomePanelWeb() {
  const router = useRouter();
  const exploreDesktopInline = useExploreDesktopSidebarActive();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const sheetVisitedColors = useMemo(() => {
    const base = Colors[colorScheme ?? "light"];
    return {
      ...base,
      background: base.countriesPanelVisitedBackground,
      backgroundElevated: base.countriesPanelVisitedBackgroundElevated,
      border: base.countriesPanelVisitedBorder,
      borderSubtle: base.countriesPanelVisitedBorderSubtle,
    };
  }, [colorScheme]);
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();
  const kpis = useProfileKpis();
  const [levelsOpen, setLevelsOpen] = useState(false);

  const profileKpisFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (profileKpisFirstFocusRef.current) {
        profileKpisFirstFocusRef.current = false;
        return;
      }
      void kpis.refetch({ silent: true });
    }, [kpis.refetch]),
  );

  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("booting");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const refreshFromSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user || user.is_anonymous) {
      clearCountriesShareVisitedSession();
      resetProfileAvatarDisplayBust();
      setUserEmail(null);
      setProfile(null);
      setSessionPhase("guest");
      return;
    }
    setUserEmail(user.email ?? null);
    setSessionPhase("user");
    void touchMyProfileLastActivity();
    const { data, error } = await fetchMyProfile();
    if (error) {
      toast.show(error.message, { type: "error" });
      setProfile(null);
    } else {
      setProfile(data);
    }
  }, [toast.show]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshFromSession();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshFromSession]);

  const displayName = profile?.display_name?.trim() ?? "";
  const greeting = displayName || userEmail?.trim() || "Tu cuenta";

  const pointsLabel = useMemo(() => {
    return new Intl.NumberFormat("es-MX").format(kpis.flowsPoints);
  }, [kpis.flowsPoints]);

  const profileAvatarUriBust = useSyncExternalStore(
    subscribeProfileAvatarDisplayBust,
    getProfileAvatarDisplayBustSnapshot,
    getProfileAvatarDisplayBustSnapshot,
  );
  const avatarPublicUrl = useMemo(
    () => buildProfileAvatarDisplayUrl(profile?.avatar_storage_path ?? null, profileAvatarUriBust),
    [profile?.avatar_storage_path, profileAvatarUriBust],
  );

  const [avatarBusy, setAvatarBusy] = useState(false);
  const onPickAvatarFromHome = useCallback(async () => {
    if (sessionPhase !== "user" || avatarBusy) return;
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
  }, [sessionPhase, avatarBusy, toast.show]);

  const onLogout = useCallback(async () => {
    await supabase.auth.signOut();
    clearCountriesShareVisitedSession();
    router.replace("/");
  }, [router]);

  const [shareProgressBusy, setShareProgressBusy] = useState(false);
  const shareProgressInFlightRef = useRef(false);
  const onShareVisitedProgress = useCallback(async () => {
    if (shareProgressInFlightRef.current) return;
    shareProgressInFlightRef.current = true;
    setShareProgressBusy(true);
    try {
      await shareVisitedCountriesProgress({
        show: toast.show,
        colorScheme: colorScheme ?? "light",
      });
    } finally {
      shareProgressInFlightRef.current = false;
      setShareProgressBusy(false);
    }
  }, [colorScheme, toast.show]);

  const goSubPanel = useCallback(
    (key: "details" | "privacy" | "language") => {
      blurActiveElement();
      if (exploreDesktopInline) {
        router.setParams({ [ACCOUNT_DESKTOP_QUERY_KEY]: key });
      } else {
        const href = key === "details" ? "/account/account" : key === "privacy" ? "/account/privacy" : "/account/language";
        (router.push as (h: string) => void)(href);
      }
    },
    [exploreDesktopInline, router],
  );

  const menuItem = (args: { title: string; subtitle: string; panel: "details" | "privacy" | "language" }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => goSubPanel(args.panel)}
      style={({ pressed }) => ({
        width: "100%",
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.base,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.backgroundElevated,
        opacity: pressed ? 0.9 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[TypographyStyles.body, { color: colors.text, fontWeight: "700" }]}>{args.title}</Text>
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
          {args.subtitle}
        </Text>
      </View>
      <View
        pointerEvents="none"
        {...(Platform.OS === "web"
          ? ({ "aria-hidden": true } as object)
          : { accessibilityElementsHidden: true })}
      >
        <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2.2} />
      </View>
    </Pressable>
  );

  const kpiColors = useMemo(
    () => ({
      text: sheetVisitedColors.text,
      textSecondary: sheetVisitedColors.textSecondary,
      primary: sheetVisitedColors.primary,
      borderSubtle: sheetVisitedColors.borderSubtle,
      borderInteractive: sheetVisitedColors.border,
      background: sheetVisitedColors.background,
      backgroundElevated: sheetVisitedColors.backgroundElevated,
    }),
    [sheetVisitedColors],
  );

  const progressColors = useMemo(
    () => ({
      text: sheetVisitedColors.text,
      textSecondary: sheetVisitedColors.textSecondary,
      primary: sheetVisitedColors.primary,
      borderSubtle: sheetVisitedColors.borderSubtle,
      stateSuccess: sheetVisitedColors.stateSuccess,
    }),
    [sheetVisitedColors],
  );

  const bodyContent =
    sessionPhase === "booting" ? (
      <View style={{ width: "100%", paddingVertical: 32, alignItems: "center" }}>
        <ActivityIndicator color={sheetVisitedColors.primary} />
      </View>
    ) : sessionPhase === "guest" ? (
      <View style={{ width: "100%" }}>
        <Text style={[TypographyStyles.body, { color: colors.textSecondary }]}>
          Inicia sesión para ver y editar tu cuenta.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            openAuthModal({
              message: AUTH_MODAL_MESSAGES.profile,
              onSuccess: () => void refreshFromSession(),
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
      <View style={{ width: "100%" }}>
        <View
          style={{
            width: "100%",
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: sheetVisitedColors.borderSubtle,
            backgroundColor: sheetVisitedColors.backgroundElevated,
            paddingVertical: Spacing.base,
            gap: Spacing.md,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: Spacing.xs }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={avatarPublicUrl ? "Cambiar foto de perfil" : "Subir foto de perfil"}
              disabled={avatarBusy}
              onPress={() => void onPickAvatarFromHome()}
              style={({ pressed }) => ({
                opacity: avatarBusy ? 0.75 : pressed ? 0.92 : 1,
              })}
            >
              <View
                style={{
                  width: AVATAR_HOME,
                  height: AVATAR_HOME,
                  borderRadius: AVATAR_HOME / 2,
                  borderWidth: 2,
                  overflow: "hidden",
                  borderColor: sheetVisitedColors.borderSubtle,
                  backgroundColor: sheetVisitedColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {avatarPublicUrl ? (
                  <Image source={{ uri: avatarPublicUrl }} style={{ width: AVATAR_HOME, height: AVATAR_HOME }} />
                ) : (
                  <Text style={[TypographyStyles.heading2, { color: sheetVisitedColors.textSecondary, fontSize: 32 }]}>
                    {(displayName || userEmail || "?").charAt(0).toUpperCase()}
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
            </Pressable>
          </View>

          <Text style={[TypographyStyles.heading3, { color: sheetVisitedColors.text, textAlign: "center" }]}>
            {greeting}
          </Text>

          {!kpis.loading ? (
            <>
              <CountriesSheetKpiRow
                filterMode="visited"
                summaryCountriesCount={Math.max(0, kpis.visitedCountriesCount ?? 0)}
                summaryPlacesCount={Math.max(0, kpis.visitedPlacesCount)}
                pointsLabel={pointsLabel}
                colors={kpiColors}
                onCountriesKpiPress={() => {
                  markExploreOpenCountriesSheetOnce({ filter: "visited", view: "summary" });
                  router.replace("/");
                }}
                onSpotsKpiPress={() => {
                  markExploreOpenCountriesSheetOnce({ filter: "visited", view: "all_places" });
                  router.replace("/");
                }}
              />
              <CountriesSheetVisitedProgress
                levelLabel={kpis.currentTravelerLevel.label}
                levelIndex={kpis.currentTravelerLevel.level}
                currentTravelerPoints={kpis.flowsPoints}
                colors={progressColors}
                onPressLevels={() => setLevelsOpen(true)}
              />
              <View style={{ width: "100%", paddingHorizontal: Spacing.base }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Compartir mi avance"
                  disabled={shareProgressBusy}
                  onPress={() => void onShareVisitedProgress()}
                  style={({ pressed }) => ({
                    marginTop: Spacing.xs,
                    paddingVertical: 12,
                    paddingHorizontal: Spacing.md,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: sheetVisitedColors.border,
                    backgroundColor: pressed
                      ? sheetVisitedColors.background
                      : "transparent",
                    alignItems: "center",
                    opacity: shareProgressBusy ? 0.55 : 1,
                  })}
                >
                  <Text
                    style={[
                      TypographyStyles.body,
                      { color: sheetVisitedColors.text, fontWeight: "600" },
                    ]}
                  >
                    {shareProgressBusy ? "Compartiendo…" : "Compartir mi avance"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View
              style={{ width: "100%", gap: Spacing.md, paddingVertical: Spacing.sm }}
              accessibilityLabel="Cargando resumen de viaje"
            >
              <View style={{ gap: Spacing.sm }}>
                <View
                  style={{
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: sheetVisitedColors.borderSubtle,
                    opacity: 0.55,
                  }}
                />
                <View
                  style={{
                    height: 96,
                    borderRadius: 14,
                    backgroundColor: sheetVisitedColors.borderSubtle,
                    opacity: 0.4,
                  }}
                />
              </View>
              <View style={{ alignItems: "center", paddingTop: Spacing.xs }}>
                <ActivityIndicator color={sheetVisitedColors.primary} />
              </View>
            </View>
          )}
        </View>

        <View style={{ width: "100%", marginTop: Spacing.lg, gap: Spacing.md }}>
          <Text
            style={[
              TypographyStyles.heading3,
              { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: Spacing.xs },
            ]}
          >
            Menú
          </Text>
          {menuItem({
            title: "Cuenta",
            subtitle: "Nombre, correo y foto de perfil",
            panel: "details",
          })}
          {menuItem({
            title: "Privacidad de fotos",
            subtitle: "Compartir con el mundo o guardar como privadas",
            panel: "privacy",
          })}
          {menuItem({
            title: "Idioma",
            subtitle: "Próximamente: configura el idioma de la app",
            panel: "language",
          })}

          <Pressable
            accessibilityRole="button"
            onPress={() => void onLogout()}
            style={({ pressed }) => ({
              marginTop: Spacing.lg,
              paddingVertical: 14,
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={[TypographyStyles.body, { color: colors.stateError, fontWeight: "700" }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <Fragment>
      {bodyContent}
      <TravelerLevelsModal
        visible={levelsOpen}
        onClose={() => setLevelsOpen(false)}
        currentLevel={kpis.currentTravelerLevel}
        colors={{
          text: sheetVisitedColors.text,
          textSecondary: sheetVisitedColors.textSecondary,
          background: sheetVisitedColors.background,
          backgroundElevated: sheetVisitedColors.backgroundElevated,
          borderSubtle: sheetVisitedColors.borderSubtle,
        }}
      />
    </Fragment>
  );
}
