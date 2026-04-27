import { SheetHandle } from "@/components/design-system/sheet-handle";
import { Spacing } from "@/constants/theme";
import { ArrowLeft, Share2, X } from "lucide-react-native";
import type { ReactNode } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ExploreContextSheetHeaderColors = {
  text: string;
  textSecondary: string;
  borderSubtle: string;
};

export type ExploreContextSheetHeaderProps = {
  title: string;
  state: "peek" | "medium" | "expanded";
  colors: ExploreContextSheetHeaderColors;
  onTitlePress?: () => void;
  onShare?: () => void;
  shareDisabled?: boolean;
  backAction?: { onPress: () => void; accessibilityLabel?: string };
  onClose?: () => void;
  titleSlot?: ReactNode;
  rightSlot?: ReactNode;
  onDragAreaLayout?: (event: LayoutChangeEvent) => void;
  onHeaderLayout?: (event: LayoutChangeEvent) => void;
  hideSheetHandle?: boolean;
};

const SHEET_HEADER_BUTTON_SIZE = 40;

export function ExploreContextSheetHeader({
  title,
  state,
  colors,
  onTitlePress,
  onShare,
  shareDisabled = false,
  backAction,
  onClose,
  titleSlot,
  rightSlot,
  onDragAreaLayout,
  onHeaderLayout,
  hideSheetHandle = false,
}: ExploreContextSheetHeaderProps) {
  const hasLeftAction = backAction != null || onShare != null;
  const hasRightAction = rightSlot != null || onClose != null;
  const titleAccessibilityLabel =
    state === "peek" ? "Expandir" : state === "medium" ? "Expandir más" : "Reducir";

  const titleContent =
    titleSlot != null ? (
      titleSlot
    ) : (
      <View style={styles.titleRow}>
        <View style={styles.titleTextWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    );

  return (
    <View style={styles.dragArea} onLayout={onDragAreaLayout}>
      {hideSheetHandle ? null : (
        <View style={styles.handleRow}>
          <SheetHandle onPress={onTitlePress} />
        </View>
      )}
      <View style={styles.headerRow} onLayout={onHeaderLayout}>
        {backAction ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerActionButton,
              { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
            ]}
            onPress={backAction.onPress}
            accessibilityLabel={backAction.accessibilityLabel ?? "Volver"}
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : onShare ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerActionButton,
              { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
            ]}
            onPress={onShare}
            disabled={shareDisabled}
            accessibilityLabel="Compartir"
            accessibilityRole="button"
          >
            <Share2 size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}

        {onTitlePress ? (
          <Pressable
            style={styles.titleWrap}
            onPress={onTitlePress}
            accessibilityLabel={titleAccessibilityLabel}
            accessibilityRole="button"
          >
            {titleContent}
          </Pressable>
        ) : (
          <View style={styles.titleWrap} pointerEvents="box-none">
            {titleContent}
          </View>
        )}

        {rightSlot != null ? (
          <View style={styles.headerRightSlot}>{rightSlot}</View>
        ) : hasRightAction ? (
          <Pressable
            style={[styles.headerActionButton, { backgroundColor: colors.borderSubtle }]}
            onPress={onClose}
            accessibilityLabel="Cerrar"
            accessibilityRole="button"
          >
            <X size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : hasLeftAction ? (
          <View style={styles.headerPlaceholder} />
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dragArea: {
    flexShrink: 0,
  },
  handleRow: {
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
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
  headerRightSlot: {
    minHeight: SHEET_HEADER_BUTTON_SIZE,
    alignItems: "flex-end",
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
    lineHeight: 24,
    textAlign: "center",
  },
});
