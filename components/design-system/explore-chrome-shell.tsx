/**
 * Host único del chrome inferior de Explorar (búsqueda + perfil): modo welcome (sheet lista)
 * o modo KPI (banda Por visitar / Visitados). Ver docs/contracts/EXPLORE_CHROME_SHELL.md.
 */

import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import {
  ExploreWelcomeSheet,
  type ExploreWelcomeSheetProps,
} from "@/components/design-system/explore-welcome-sheet";
import {
  ExploreSearchActionRow,
  type ExploreSearchActionRowProps,
} from "@/components/design-system/explore-search-action-row";
import { WEB_SHEET_MAX_WIDTH } from "@/lib/web-layout";
import React from "react";
import { StyleSheet, View } from "react-native";

export type ExploreChromeShellMode = "welcome" | "kpi";

export type ExploreChromeShellProps = {
  mode: ExploreChromeShellMode;
  /** Props completas del sheet de bienvenida (solo modo `welcome`). */
  welcomeProps: ExploreWelcomeSheetProps;
  /** Props de la fila de acción; `fullWidth` se pasa aparte para KPI. */
  kpiRowProps: ExploreSearchActionRowProps;
  kpiFullWidth: boolean;
  /** Insets del overlay absoluto (paridad MapScreen). */
  overlayLeft: number;
  overlayRight: number;
  overlayBottom: number;
};

export function ExploreChromeShell({
  mode,
  welcomeProps,
  kpiRowProps,
  kpiFullWidth,
  overlayLeft,
  overlayRight,
  overlayBottom,
}: ExploreChromeShellProps) {
  if (mode === "welcome") {
    return <ExploreWelcomeSheet {...welcomeProps} />;
  }

  return (
    <View
      style={[
        styles.bottomActionRowOverlay,
        kpiFullWidth && styles.bottomActionRowKpiHost,
        {
          left: overlayLeft,
          right: overlayRight,
          bottom: overlayBottom,
          pointerEvents: "box-none",
        },
      ]}
    >
      <View
        style={kpiFullWidth ? styles.bottomActionRowKpiInner : styles.bottomActionRowFullBleed}
      >
        <ExploreSearchActionRow {...kpiRowProps} fullWidth={kpiFullWidth} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomActionRowOverlay: {
    position: "absolute",
    zIndex: EXPLORE_LAYER_Z.TOP_ACTIONS,
    alignItems: "center",
  },
  bottomActionRowKpiHost: {
    alignItems: "center",
  },
  bottomActionRowKpiInner: {
    width: "100%",
    maxWidth: WEB_SHEET_MAX_WIDTH,
    alignSelf: "center",
  },
  bottomActionRowFullBleed: {
    width: "100%",
  },
});
