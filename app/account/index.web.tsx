/**
 * Perfil vNext — Home de menú (web).
 * Desktop Explore (≥1080): redirige a `/?account=profile` (panel en columna lateral del mapa).
 */

import { AccountShell } from "@/components/account/AccountShell";
import { AccountHomePanelWeb } from "@/components/account/web/AccountHomePanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { Redirect } from "expo-router";

export default function AccountScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={{ pathname: "/", params: { account: "profile" } }} />;
  }
  return (
    <AccountShell title="Perfil" showBack={false} loading={false}>
      <AccountHomePanelWeb />
    </AccountShell>
  );
}
