import { webExploreUsesDesktopSidebar } from "@/lib/web-layout";
import { Platform, useWindowDimensions } from "react-native";

/** Misma regla que `webDesktopExploreSplitLayout` en MapScreen (Explore columna ≥1080). */
export function useExploreDesktopSidebarActive(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && webExploreUsesDesktopSidebar(width);
}
