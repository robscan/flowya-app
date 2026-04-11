/**
 * Panel lateral Explore (web ≥1080): anima el **contenedor** en ancho (solo entrada al montar / cambiar `animationKey`).
 */

import { WEB_EXPLORE_SIDEBAR_PANEL_WIDTH } from "@/lib/web-layout";
import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, View, type ViewStyle } from "react-native";

const ENTRANCE_DURATION_MS = 400;

type ExploreDesktopSidebarAnimatedColumnProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[] | undefined;
  animationKey: string;
  panelWidth?: number;
  /**
   * Sin animación de entrada (ancho ya visible): p. ej. al cambiar de filtro/sheet dentro del mismo
   * layout de sidebar desktop. La entrada solo debe verse cuando la columna lateral pasó de no existir a existir.
   */
  skipEntranceAnimation?: boolean;
  /**
   * Durante la animación de ancho (entrada), el map stage cambia cada frame: Mapbox debe `resize()` para
   * que el globo/canvas no queden desfasados.
   */
  onStageWidthAnimationFrame?: () => void;
};

export function ExploreDesktopSidebarAnimatedColumn({
  children,
  style,
  animationKey,
  panelWidth = WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  skipEntranceAnimation = false,
  onStageWidthAnimationFrame,
}: ExploreDesktopSidebarAnimatedColumnProps) {
  const w = panelWidth;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const onFrameRef = useRef(onStageWidthAnimationFrame);
  onFrameRef.current = onStageWidthAnimationFrame;

  useEffect(() => {
    if (skipEntranceAnimation) {
      widthAnim.setValue(w);
      /** Sin animación de entrada pero sí cambio de `w` (p. ej. KPI países ↔ listado lugares): el map stage
       * cambia de ancho; Mapbox debe `resize()` tras layout (doble rAF alineado a MapScreenVNext). */
      let id2: number | null = null;
      const id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => {
          id2 = null;
          onFrameRef.current?.();
        });
      });
      return () => {
        cancelAnimationFrame(id1);
        if (id2 != null) cancelAnimationFrame(id2);
      };
    }
    widthAnim.setValue(0);
    const listenerId = widthAnim.addListener(() => {
      onFrameRef.current?.();
    });
    Animated.timing(widthAnim, {
      toValue: w,
      duration: ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onFrameRef.current?.();
    });
    return () => {
      widthAnim.removeListener(listenerId);
    };
  }, [animationKey, w, widthAnim, skipEntranceAnimation]);

  return (
    <Animated.View
      style={[
        style,
        {
          width: widthAnim,
          maxWidth: w,
          overflow: "hidden",
        },
      ]}
    >
      <View
        style={{
          width: w,
          flex: 1,
          minHeight: 0,
          alignSelf: "stretch",
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
