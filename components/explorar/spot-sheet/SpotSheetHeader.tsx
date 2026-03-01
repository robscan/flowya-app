import { IconButton } from "@/components/design-system/icon-button";
import { SheetHandle } from "@/components/design-system/sheet-handle";
import { Radius, Spacing } from "@/constants/theme";
import { ArrowLeft, Share2, X } from "lucide-react-native";
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
  state: "peek" | "medium" | "expanded";
  colors: HeaderColors;
  onHeaderTap: () => void;
  onShare: () => void;
  onDraftBackToPlacing?: () => void;
  onClose: () => void;
  onDragAreaLayout: (e: LayoutChangeEvent) => void;
  onHeaderLayout: (e: LayoutChangeEvent) => void;
};

const HEADER_BUTTON_SIZE = 40;

export function SpotSheetHeader({
  isDraft,
  isPlacingDraftSpot,
  isPoiMode,
  poiLoading,
  displayTitle,
  state,
  colors,
  onHeaderTap,
  onShare,
  onDraftBackToPlacing,
  onClose,
  onDragAreaLayout,
  onHeaderLayout,
}: SpotSheetHeaderProps) {
  return (
    <View style={styles.dragArea} onLayout={onDragAreaLayout}>
      <View style={styles.handleRow}>
        <SheetHandle onPress={onHeaderTap} />
      </View>
      <View style={styles.headerRow} onLayout={onHeaderLayout}>
        {!isDraft ? (
          <IconButton
            variant="default"
            size={HEADER_BUTTON_SIZE}
            onPress={onShare}
            disabled={isPoiMode && poiLoading}
            accessibilityLabel="Compartir"
          >
            <Share2 size={20} color={colors.text} strokeWidth={2} />
          </IconButton>
        ) : isDraft && !isPlacingDraftSpot && onDraftBackToPlacing ? (
          <IconButton
            variant="default"
            size={HEADER_BUTTON_SIZE}
            onPress={onDraftBackToPlacing}
            accessibilityLabel="Atrás"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </IconButton>
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
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
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
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
