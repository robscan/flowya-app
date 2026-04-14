import { SheetHandle } from "@/components/design-system/sheet-handle";
import { Radius, Spacing } from "@/constants/theme";
import { ArrowLeft, Search, Share2, X } from "lucide-react-native";
import type { ReactNode } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type HeaderColors = {
  text: string;
  textSecondary: string;
  borderSubtle: string;
};

export type SpotSheetHeaderProps = {
  isDraft: boolean;
  isPlacingDraftSpot: boolean;
  isPoiMode: boolean;
  poiLoading: boolean;
  displayTitle: string;
  /** Si se define, sustituye el título centrado (el área no dispara expandir/reducir el sheet; usa el handle). */
  titleSlot?: ReactNode;
  state: "peek" | "medium" | "expanded";
  colors: HeaderColors;
  onHeaderTap: () => void;
  onShare: () => void;
  shareDisabled?: boolean;
  /** Si está definido, el botón izquierdo es «Atrás» en lugar de compartir (p. ej. detalle país en CountriesSheet). */
  backAction?: { onPress: () => void };
  /** Acción opcional a la derecha (antes de cerrar), p. ej. abrir buscador desde CountriesSheet. */
  onSearchPress?: () => void;
  onDraftBackToPlacing?: () => void;
  onClose: () => void;
  onDragAreaLayout: (e: LayoutChangeEvent) => void;
  onHeaderLayout: (e: LayoutChangeEvent) => void;
  /** Panel lateral web: sin arrastre; oculta el handle. */
  hideSheetHandle?: boolean;
};

/** Botón redondo 40px (cerrar / compartir / atrás); exportado para alinear chrome fuera del sheet (p. ej. cuenta). */
export const SHEET_HEADER_BUTTON_SIZE = 40;

export function SpotSheetHeader({
  isDraft,
  isPlacingDraftSpot,
  isPoiMode,
  poiLoading,
  displayTitle,
  titleSlot,
  state,
  colors,
  onHeaderTap,
  onShare,
  shareDisabled = false,
  backAction,
  onSearchPress,
  onDraftBackToPlacing,
  onClose,
  onDragAreaLayout,
  onHeaderLayout,
  hideSheetHandle = false,
}: SpotSheetHeaderProps) {
  return (
    <View style={styles.dragArea} onLayout={onDragAreaLayout}>
      {hideSheetHandle ? null : (
        <View style={styles.handleRow}>
          <SheetHandle onPress={onHeaderTap} />
        </View>
      )}
      <View style={styles.headerRow} onLayout={onHeaderLayout}>
        {!isDraft && backAction ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerActionButton,
              { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
            ]}
            onPress={backAction.onPress}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : !isDraft ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerActionButton,
              { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
            ]}
            onPress={onShare}
            disabled={(isPoiMode && poiLoading) || shareDisabled}
            accessibilityLabel="Compartir"
            accessibilityRole="button"
          >
            <Share2 size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : isDraft && !isPlacingDraftSpot && onDraftBackToPlacing ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerActionButton,
              { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
            ]}
            onPress={onDraftBackToPlacing}
            accessibilityLabel="Atrás"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
        {isDraft ? (
          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              <View style={styles.titleTextWrap}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {displayTitle}
                </Text>
              </View>
              <View
                style={[
                  styles.draftBadge,
                  { backgroundColor: colors.borderSubtle },
                ]}
              >
                <Text
                  style={[
                    styles.draftBadgeText,
                    { color: colors.textSecondary },
                  ]}
                >
                  BORRADOR
                </Text>
              </View>
            </View>
          </View>
        ) : titleSlot != null ? (
          <View style={styles.titleWrap} pointerEvents="box-none">
            {titleSlot}
          </View>
        ) : (
          <Pressable
            style={styles.titleWrap}
            onPress={onHeaderTap}
            accessibilityLabel={
              state === "peek"
                ? "Expandir"
                : state === "medium"
                  ? "Expandir más"
                  : "Reducir"
            }
            accessibilityRole="button"
          >
            <View style={styles.titleRow}>
              <View style={styles.titleTextWrap}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {displayTitle}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        {onSearchPress ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerActionButton,
              { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
            ]}
            onPress={onSearchPress}
            accessibilityLabel="Buscar"
            accessibilityRole="button"
          >
            <Search size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.borderSubtle }]}
          onPress={onClose}
          accessibilityLabel={isDraft ? "Descartar borrador" : "Cerrar"}
          accessibilityRole="button"
        >
          <X size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dragArea: {
    flexShrink: 0,
  },
  handleRow: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  headerPlaceholder: {
    width: SHEET_HEADER_BUTTON_SIZE,
    height: SHEET_HEADER_BUTTON_SIZE,
  },
  headerActionButton: {
    width: SHEET_HEADER_BUTTON_SIZE,
    height: SHEET_HEADER_BUTTON_SIZE,
    borderRadius: SHEET_HEADER_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  draftBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  draftBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  closeButton: {
    width: SHEET_HEADER_BUTTON_SIZE,
    height: SHEET_HEADER_BUTTON_SIZE,
    borderRadius: SHEET_HEADER_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
