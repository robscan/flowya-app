import { TypographyStyles } from "@/components/design-system/typography";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  countTagUsageById,
  deleteUserTag,
  fetchPinTagsIndexForSession,
  getUserTagsRevisionSnapshot,
  listUserTags,
  renameUserTag,
  subscribeUserTagsRevision,
  type UserTagRow,
} from "@/lib/tags";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function AccountTagsPanelWeb() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();

  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<UserTagRow[]>([]);
  const [usageByTagId, setUsageByTagId] = useState<Record<string, number>>({});
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [renameBusyTagId, setRenameBusyTagId] = useState<string | null>(null);
  const [deleteConfirmTagId, setDeleteConfirmTagId] = useState<string | null>(null);
  const [deleteBusyTagId, setDeleteBusyTagId] = useState<string | null>(null);
  const tagsRevision = useSyncExternalStore(
    subscribeUserTagsRevision,
    getUserTagsRevisionSnapshot,
    getUserTagsRevisionSnapshot,
  );

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user || user.is_anonymous) {
      setSessionReady(false);
      setTags([]);
      setUsageByTagId({});
      setEditingTagId(null);
      setEditingValue("");
      setDeleteConfirmTagId(null);
      setLoading(false);
      return;
    }
    setSessionReady(true);
    try {
      const [rows, pinIndex] = await Promise.all([listUserTags(), fetchPinTagsIndexForSession()]);
      setTags(rows);
      setUsageByTagId(countTagUsageById(pinIndex));
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar tus etiquetas.";
      toast.show(message, { type: "error" });
      setTags([]);
      setUsageByTagId({});
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tagsRevision === 0 || !sessionReady) return;
    void load();
  }, [tagsRevision, sessionReady, load]);

  const sortedTags = useMemo(
    () =>
      [...tags].sort(
        (a, b) =>
          (usageByTagId[b.id] ?? 0) - (usageByTagId[a.id] ?? 0) ||
          a.name.localeCompare(b.name, "es"),
      ),
    [tags, usageByTagId],
  );

  const startRename = useCallback((tag: UserTagRow) => {
    setEditingTagId(tag.id);
    setEditingValue(tag.name);
    setDeleteConfirmTagId(null);
  }, []);

  const cancelRename = useCallback(() => {
    setEditingTagId(null);
    setEditingValue("");
  }, []);

  const handleSaveRename = useCallback(
    async (tag: UserTagRow) => {
      const nextName = editingValue.trim();
      if (!nextName) {
        toast.show("Escribe un nombre para la etiqueta.", { type: "error" });
        return;
      }
      if (nextName === tag.name.trim()) {
        cancelRename();
        return;
      }
      setRenameBusyTagId(tag.id);
      try {
        const updated = await renameUserTag(tag.id, nextName);
        setTags((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        setEditingTagId(null);
        setEditingValue("");
        toast.show("Etiqueta actualizada.", { type: "success", replaceVisible: true });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo actualizar la etiqueta.";
        toast.show(message, { type: "error" });
      } finally {
        setRenameBusyTagId(null);
      }
    },
    [editingValue, cancelRename, toast],
  );

  const handleConfirmDelete = useCallback(
    async (tag: UserTagRow) => {
      setDeleteBusyTagId(tag.id);
      try {
        await deleteUserTag(tag.id);
        setTags((prev) => prev.filter((row) => row.id !== tag.id));
        setUsageByTagId((prev) => {
          if (!(tag.id in prev)) return prev;
          const next = { ...prev };
          delete next[tag.id];
          return next;
        });
        setDeleteConfirmTagId(null);
        if (editingTagId === tag.id) {
          setEditingTagId(null);
          setEditingValue("");
        }
        toast.show("Etiqueta eliminada.", { type: "error", replaceVisible: true });
      } catch {
        toast.show("No se pudo eliminar la etiqueta.", { type: "error" });
      } finally {
        setDeleteBusyTagId(null);
      }
    },
    [editingTagId, toast],
  );

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!sessionReady) {
    return (
      <View style={styles.column}>
        <Text style={[TypographyStyles.body, { color: colors.textSecondary }]}>
          Inicia sesión para administrar tus etiquetas.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            openAuthModal({
              message: AUTH_MODAL_MESSAGES.profile,
              onSuccess: () => void load(),
            })
          }
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[TypographyStyles.body, styles.primaryButtonLabel]}>Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.introCard,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <Text style={[TypographyStyles.body, { color: colors.text, fontWeight: "700" }]}>
          Etiquetas
        </Text>
        <Text style={[TypographyStyles.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
          Renombra o elimina etiquetas globales. Para crear nuevas o asignarlas a lugares, usa Explore.
        </Text>
      </View>

      {sortedTags.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Text style={[TypographyStyles.body, { color: colors.text }]}>Aún no tienes etiquetas.</Text>
          <Text style={[TypographyStyles.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
            Crea la primera desde un lugar guardado o visitado y después podrás administrarla aquí.
          </Text>
        </View>
      ) : (
        sortedTags.map((tag) => {
          const usageCount = usageByTagId[tag.id] ?? 0;
          const isEditing = editingTagId === tag.id;
          const renameBusy = renameBusyTagId === tag.id;
          const deleteBusy = deleteBusyTagId === tag.id;
          const showDeleteConfirm = deleteConfirmTagId === tag.id;
          return (
            <View
              key={tag.id}
              style={[
                styles.tagCard,
                {
                  backgroundColor: colors.backgroundElevated,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              {isEditing ? (
                <View style={styles.editColumn}>
                  <TextInput
                    value={editingValue}
                    onChangeText={setEditingValue}
                    placeholder="Nombre de la etiqueta"
                    placeholderTextColor={colors.textSecondary}
                    editable={!renameBusy}
                    autoCorrect={false}
                    autoCapitalize="sentences"
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  />
                  <Text style={[TypographyStyles.caption, { color: colors.textSecondary }]}>
                    Uso actual: {usageCount} {usageCount === 1 ? "lugar" : "lugares"}
                  </Text>
                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void handleSaveRename(tag)}
                      disabled={renameBusy}
                      style={({ pressed }) => [
                        styles.actionButtonPrimary,
                        {
                          backgroundColor: colors.primary,
                          opacity: renameBusy ? 0.7 : pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      {renameBusy ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.actionButtonPrimaryLabel}>Guardar</Text>
                      )}
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={cancelRename}
                      disabled={renameBusy}
                      style={({ pressed }) => [
                        styles.actionButtonSecondary,
                        {
                          borderColor: colors.borderSubtle,
                          backgroundColor: colors.background,
                          opacity: renameBusy ? 0.6 : pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      <Text style={[TypographyStyles.body, { color: colors.text, fontWeight: "600" }]}>
                        Cancelar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.tagHeaderRow}>
                    <View style={styles.tagHeaderText}>
                      <Text style={[TypographyStyles.body, { color: colors.text, fontWeight: "700" }]}>
                        #{tag.name}
                      </Text>
                      <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                        {usageCount} {usageCount === 1 ? "lugar" : "lugares"}
                      </Text>
                    </View>
                    <View style={styles.iconButtonsRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Editar etiqueta ${tag.name}`}
                        onPress={() => startRename(tag)}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            borderColor: colors.borderSubtle,
                            backgroundColor: colors.background,
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                      >
                        <Pencil size={16} color={colors.text} strokeWidth={2.1} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar etiqueta ${tag.name}`}
                        onPress={() =>
                          setDeleteConfirmTagId((prev) => (prev === tag.id ? null : tag.id))
                        }
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            borderColor: colors.borderSubtle,
                            backgroundColor: colors.background,
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                      >
                        <Trash2 size={16} color={colors.stateError} strokeWidth={2.1} />
                      </Pressable>
                    </View>
                  </View>

                  {showDeleteConfirm ? (
                    <View
                      style={[
                        styles.confirmBox,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[TypographyStyles.caption, { color: colors.text, lineHeight: 18 }]}>
                        Se eliminará la etiqueta y se quitará de sus {usageCount} lugares asociados.
                      </Text>
                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void handleConfirmDelete(tag)}
                          disabled={deleteBusy}
                          style={({ pressed }) => [
                            styles.actionButtonDanger,
                            {
                              backgroundColor: colors.stateError,
                              opacity: deleteBusy ? 0.7 : pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          {deleteBusy ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.actionButtonPrimaryLabel}>Eliminar</Text>
                          )}
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setDeleteConfirmTagId(null)}
                          disabled={deleteBusy}
                          style={({ pressed }) => [
                            styles.actionButtonSecondary,
                            {
                              borderColor: colors.borderSubtle,
                              backgroundColor: colors.backgroundElevated,
                              opacity: deleteBusy ? 0.6 : pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Text style={[TypographyStyles.body, { color: colors.text, fontWeight: "600" }]}>
                            Cancelar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    width: "100%",
    paddingVertical: 40,
    alignItems: "center",
  },
  column: {
    width: "100%",
    gap: Spacing.md,
  },
  introCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  tagCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  tagHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.base,
  },
  tagHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  iconButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  editColumn: {
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    minHeight: 48,
    paddingHorizontal: Spacing.base,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButtonPrimary: {
    minHeight: 44,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  actionButtonDanger: {
    minHeight: 44,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  actionButtonSecondary: {
    minHeight: 44,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  actionButtonPrimaryLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  confirmBox: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  primaryButton: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonLabel: {
    fontWeight: "700",
    color: "#fff",
  },
});
