import { AccountShell } from "@/components/account/AccountShell";
import { AccountTagsPanelWeb } from "@/components/account/web/AccountTagsPanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { Redirect } from "expo-router";

export default function AccountTagsScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={{ pathname: "/", params: { account: "tags" } }} />;
  }
  return (
    <AccountShell title="Etiquetas" showBack loading={false}>
      <AccountTagsPanelWeb />
    </AccountShell>
  );
}
