/**
 * Panel lateral Explore (web ≥1080): anima el **contenedor** en ancho (solo entrada al montar / cambiar `animationKey`).
 * `ExploreDesktopSidebarPanelBody`: fade-in al cambiar contenido (welcome ↔ países ↔ spot) para reducir parpadeo.
 */

import { WEB_EXPLORE_SIDEBAR_PANEL_WIDTH } from "@/lib/web-layout";
import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, Platform, View, type ViewStyle } from "react-native";

const PANEL_CONTENT_FADE_IN_MS = 220;
const PANEL_CONTENT_FADE_FROM = 0.94;

const ENTRANCE_DURATION_MS = 400;

type ExploreDesktopSidebarAnimatedColumnProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[] | undefined;
  animationKey: string;
  panelWidth?: number;
  /**
   * Sin animación de entrada (ancho ya visible): p. ej. al cambiar de filtro/sheet dentro del mismo
   * layout de sidebar desktop. La entrada solo debe verse cuando la columna lateral pasó de no existir a existir.
   *
   * Usa `View` con ancho fijo (no `Animated.Value`) para que al cambiar `panelWidth` (p. ej. KPI 400px ↔
   * listado lugares 720px) no haya un frame con contenedor estrecho y contenido ancho — `overflow: hidden`
   * recortaba la sheet.
   */
  skipEntranceAnimation?: boolean;
  /**
   * Durante la animación de ancho (entrada), el map stage cambia cada frame: Mapbox debe `resize()` para
   * que el globo/canvas no queden desfasados.
   */
  onStageWidthAnimationFrame?: () => void;
};

/** Sidebar desktop sin animación de entrada: ancho siempre igual a `panelWidth` (sin bridge Animated). */
function ExploreDesktopSidebarStaticColumn({
  children,
  style,
  panelWidth,
  onStageWidthAnimationFrame,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[] | undefined;
  panelWidth: number;
  onStageWidthAnimationFrame?: () => void;
}) {
  const w = panelWidth;
  const onFrameRef = useRef(onStageWidthAnimationFrame);
  onFrameRef.current = onStageWidthAnimationFrame;

  useEffect(() => {
    /** Cambio de ancho (KPI ↔ listado lugares): map stage y Mapbox tras layout. */
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
  }, [w]);

  return (
    <View
      style={[
        style,
        {
          width: w,
          maxWidth: w,
          /** Sin animación de ancho: `hidden` recortaba un frame al saltar 400↔720 (KPI ↔ lugares). El sheet ya recorta bordes. */
          overflow: "visible",
        },
      ]}
    >
      <View
        style={{
          width: w,
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          alignSelf: "stretch",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function ExploreDesktopSidebarEntranceAnimatedColumn({
  children,
  style,
  animationKey,
  panelWidth = WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  onStageWidthAnimationFrame,
}: Omit<ExploreDesktopSidebarAnimatedColumnProps, "skipEntranceAnimation"> & {
  panelWidth?: number;
}) {
  const w = panelWidth;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const onFrameRef = useRef(onStageWidthAnimationFrame);
  onFrameRef.current = onStageWidthAnimationFrame;

  useEffect(() => {
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
  }, [animationKey, w, widthAnim]);

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

export function ExploreDesktopSidebarAnimatedColumn({
  children,
  style,
  animationKey,
  panelWidth = WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  skipEntranceAnimation = false,
  onStageWidthAnimationFrame,
}: ExploreDesktopSidebarAnimatedColumnProps) {
  if (skipEntranceAnimation) {
    return (
      <ExploreDesktopSidebarStaticColumn
        style={style}
        panelWidth={panelWidth}
        onStageWidthAnimationFrame={onStageWidthAnimationFrame}
      >
        {children}
      </ExploreDesktopSidebarStaticColumn>
    );
  }

  return (
    <ExploreDesktopSidebarEntranceAnimatedColumn
      style={style}
      animationKey={animationKey}
      panelWidth={panelWidth}
      onStageWidthAnimationFrame={onStageWidthAnimationFrame}
    >
      {children}
    </ExploreDesktopSidebarEntranceAnimatedColumn>
  );
}

/**
 * Envuelve el cuerpo del sidebar (sheet activo). Al cambiar `panelKey` (welcome / countries / spot),
 * aplica un fade-in corto para evitar un frame “en blanco” perceptible al sustituir árboles de React distintos.
 */
export function ExploreDesktopSidebarPanelBody({
  panelKey,
  children,
}: {
  panelKey: string;
  children: ReactNode;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const isInitialPanel = useRef(true);

  useEffect(() => {
    if (isInitialPanel.current) {
      isInitialPanel.current = false;
      return;
    }
    opacity.setValue(PANEL_CONTENT_FADE_FROM);
    Animated.timing(opacity, {
      toValue: 1,
      duration: PANEL_CONTENT_FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [panelKey, opacity]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        opacity,
      }}
    >
      {children}
    </Animated.View>
  );
}
