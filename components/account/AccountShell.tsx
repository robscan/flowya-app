/**
 * Layout compartido cuenta/perfil (web-first).
 * Cabecera alineada a SpotSheetHeader: izquierda (atrás o reserva), título centrado, cerrar derecha.
 *
 * - `layout="stack"` (default): ruta `/account*` en el stack; en web ≥768px panel flotante ~400px + modal transparente.
 * - `layout="embedded"`: panel dentro de la columna Explore (desktop); sin opciones de navegación ni overlay global.
 */

import { SHEET_HEADER_BUTTON_SIZE } from "@/components/explorar/spot-sheet/SpotSheetHeader";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { blurActiveElement } from "@/lib/focus-management";
import { WEB_VIEWPORT_REF } from "@/lib/web-layout";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import React, { useLayoutEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCOUNT_SIDEBAR_WIDTH = 400;
const ENTRY_DURATION_MS = 320;

export type AccountShellProps = {
  title: string;
  /** Si true, botón atrás a la izquierda (subpantallas). Home perfil: false + reserva para centrar título. */
  showBack?: boolean;
  onBack?: () => void;
  /** Solo el cuerpo: la cabecera permanece visible. */
  loading?: boolean;
  children: React.ReactNode;
  /** `embedded`: dentro de la columna lateral de Explore (sin stack global). */
  layout?: "stack" | "embedded";
  /** Cierre (X): en embebido, limpia `?account=` en el mapa. */
  onEmbeddedClosePanel?: () => void;
  /** Atrás: en embebido, vuelve a home de perfil en sidebar. */
  onEmbeddedBack?: () => void;
};

export function AccountShell({
  title,
  showBack = false,
  onBack,
  loading = false,
  children,
  layout = "stack",
  onEmbeddedClosePanel,
  onEmbeddedBack,
}: AccountShellProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isStackFloatingDesktop =
    layout === "stack" && Platform.OS === "web" && windowWidth >= WEB_VIEWPORT_REF.tabletMin;

  const entryX = useRef(new Animated.Value(-28)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;

  const handleBack = () => {
    blurActiveElement();
    if (onBack) onBack();
    else if (layout === "embedded" && onEmbeddedBack) onEmbeddedBack();
    else router.back();
  };

  const handleClose = () => {
    blurActiveElement();
    if (layout === "embedded" && onEmbeddedClosePanel) {
      onEmbeddedClosePanel();
      return;
    }
    /**
     * Stack (móvil / web estrecho): en **sub**pantallas (`showBack`), la X debe salir del perfil por completo
     * (Explorar), no hacer un solo `back` como la flecha atrás (que vuelve al home de perfil).
     */
    if (showBack) {
      router.replace("/");
      return;
    }
    router.back();
  };

  useLayoutEffect(() => {
    if (layout !== "stack" || Platform.OS !== "web") return;
    if (isStackFloatingDesktop) {
      navigation.setOptions({
        presentation: "transparentModal",
        contentStyle: {
          backgroundColor: "transparent",
          pointerEvents: "box-none",
        },
        animation: "fade",
      });
    } else {
      navigation.setOptions({
        presentation: "card",
        contentStyle: undefined,
        animation: "default",
      });
    }
    return () => {
      navigation.setOptions({
        presentation: "card",
        contentStyle: undefined,
      });
    };
  }, [navigation, isStackFloatingDesktop, layout]);

  const useNativeDriver = Platform.OS !== "web";

  React.useEffect(() => {
    if (layout === "embedded") return;
    entryX.setValue(-28);
    entryOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(entryX, {
        toValue: 0,
        duration: ENTRY_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: ENTRY_DURATION_MS - 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
    ]).start();
  }, [entryOpacity, entryX, useNativeDriver, layout]);

  const headerRow = (
    <View
      style={[
        styles.headerRow,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.lg,
        },
      ]}
    >
      {showBack ? (
        <Pressable
          style={({ pressed }) => [
            styles.headerActionButton,
            { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
          ]}
          onPress={handleBack}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
      <View style={styles.titleWrap} pointerEvents="none">
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.headerActionButton,
          { backgroundColor: colors.borderSubtle, opacity: pressed ? 0.86 : 1 },
        ]}
        onPress={handleClose}
        accessibilityLabel="Cerrar"
        accessibilityRole="button"
      >
        <X size={20} color={colors.text} strokeWidth={2} />
      </Pressable>
    </View>
  );

  const bodyInner = loading ? (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : (
    children
  );

  const scrollBody = (
    <ScrollView
      style={styles.scrollFlex}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + Spacing.xl, paddingHorizontal: Spacing.lg },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.innerColumn,
          { maxWidth: isStackFloatingDesktop ? ACCOUNT_SIDEBAR_WIDTH : layout === "embedded" ? ACCOUNT_SIDEBAR_WIDTH : 520 },
        ]}
      >
        {bodyInner}
      </View>
    </ScrollView>
  );

  if (layout === "embedded") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.mobileColumn}>
          {headerRow}
          {scrollBody}
        </View>
      </View>
    );
  }

  return (
    <View
      pointerEvents={isStackFloatingDesktop ? "box-none" : "auto"}
      style={[
        styles.root,
        { backgroundColor: isStackFloatingDesktop ? "transparent" : colors.background },
      ]}
    >
      {isStackFloatingDesktop ? (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.sidebarPanel,
            {
              width: ACCOUNT_SIDEBAR_WIDTH,
              borderRightColor: colors.borderSubtle,
              backgroundColor: colors.background,
              transform: [{ translateX: entryX }],
              opacity: entryOpacity,
            },
          ]}
        >
          <View style={styles.sidebarInner}>
            {headerRow}
            {scrollBody}
          </View>
        </Animated.View>
      ) : (
        <View style={styles.mobileColumn}>
          {headerRow}
          {scrollBody}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sidebarPanel: {
    height: "100%",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sidebarInner: { flex: 1 },
  mobileColumn: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  scrollFlex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  innerColumn: { alignSelf: "center", width: "100%" },
  centered: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
});
