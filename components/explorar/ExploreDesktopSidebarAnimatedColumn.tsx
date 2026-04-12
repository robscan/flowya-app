/**
 * Panel lateral Explore (web ≥1080): host `width: 0` + panel `absolute` encima del mapa.
 * El hueco visual del mapa lo reserva Mapbox (`setPadding` en MapScreen), no el flex — evita `resize()` al animar ancho.
 * `ExploreDesktopSidebarPanelBody`: opacidad + slide vertical al cambiar contenido (welcome ↔ países ↔ spot).
 */

import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { WEB_EXPLORE_SIDEBAR_PANEL_WIDTH } from "@/lib/web-layout";
import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";
import Reanimated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PANEL_CONTENT_IN_MS = 340;
const PANEL_CONTENT_OPACITY_FROM = 0.78;
const PANEL_CONTENT_TRANSLATE_FROM = 14;

const SIDEBAR_WIDTH_CHANGE_MS = 300;
const PRESENCE_ENTRANCE_MS = 380;
const PRESENCE_EXIT_MS = 320;

function stripLayoutWidthFromStyle(style: ViewStyle | ViewStyle[] | undefined): ViewStyle {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  if (flat == null) return {};
  const { width: _w, maxWidth: _mw, ...rest } = flat;
  return rest;
}

type ExploreDesktopSidebarAnimatedColumnProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[] | undefined;
  presenceOpen: boolean;
  onPresenceExitComplete?: () => void;
  panelWidth?: number;
};

export function ExploreDesktopSidebarAnimatedColumn({
  children,
  style,
  presenceOpen,
  onPresenceExitComplete,
  panelWidth = WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
}: ExploreDesktopSidebarAnimatedColumnProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const lastAnimatedWidthRef = useRef(0);
  const onExitRef = useRef(onPresenceExitComplete);
  onExitRef.current = onPresenceExitComplete;

  const targetW = presenceOpen ? panelWidth : 0;
  const restStyle = stripLayoutWidthFromStyle(style);

  const innerBody = (
    <View
      style={{
        width: panelWidth,
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        alignSelf: "stretch",
      }}
    >
      {children}
    </View>
  );

  useEffect(() => {
    const from = lastAnimatedWidthRef.current;
    const to = targetW;

    if (Math.abs(to - from) < 0.5) {
      widthAnim.setValue(to);
      lastAnimatedWidthRef.current = to;
      if (to === 0) onExitRef.current?.();
      return;
    }

    widthAnim.stopAnimation();
    widthAnim.setValue(from);

    let duration = SIDEBAR_WIDTH_CHANGE_MS;
    if (to === 0) duration = PRESENCE_EXIT_MS;
    else if (from < 1) duration = PRESENCE_ENTRANCE_MS;

    let listenerId: string | undefined;
    listenerId = widthAnim.addListener(({ value }) => {
      lastAnimatedWidthRef.current = value;
    });

    Animated.timing(widthAnim, {
      toValue: to,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (listenerId != null) {
        widthAnim.removeListener(listenerId);
        listenerId = undefined;
      }
      if (!finished) return;
      lastAnimatedWidthRef.current = to;
      if (to === 0) {
        onExitRef.current?.();
      }
    });

    return () => {
      widthAnim.stopAnimation();
      if (listenerId != null) widthAnim.removeListener(listenerId);
    };
  }, [targetW, widthAnim]);

  return (
    <View
      style={[
        restStyle,
        {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 0,
          overflow: "visible",
          zIndex: EXPLORE_LAYER_Z.SHEET_BASE,
        },
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: widthAnim,
          maxWidth: panelWidth,
          overflow: "hidden",
          zIndex: 1,
          backgroundColor:
            typeof restStyle.backgroundColor === "string"
              ? restStyle.backgroundColor
              : undefined,
        }}
      >
        {innerBody}
      </Animated.View>
    </View>
  );
}

/**
 * Envuelve el cuerpo del sidebar (sheet activo). Al cambiar `panelKey` (welcome / countries / spot),
 * aplica opacidad + slide vertical.
 */
export function ExploreDesktopSidebarPanelBody({
  panelKey,
  children,
}: {
  panelKey: string;
  children: ReactNode;
}) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isInitialPanel = useRef(true);

  useEffect(() => {
    if (isInitialPanel.current) {
      isInitialPanel.current = false;
      return;
    }
    opacity.value = PANEL_CONTENT_OPACITY_FROM;
    translateY.value = PANEL_CONTENT_TRANSLATE_FROM;
    const timing = {
      duration: PANEL_CONTENT_IN_MS,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    };
    opacity.value = withTiming(1, timing);
    translateY.value = withTiming(0, timing);
  }, [panelKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Reanimated.View
      pointerEvents="box-none"
      style={[{ flex: 1, minHeight: 0, minWidth: 0 }, animatedStyle]}
    >
      {children}
    </Reanimated.View>
  );
}
