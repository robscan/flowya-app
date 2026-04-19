import { AccountShell } from "@/components/account/AccountShell";
import { AccountPrivacyPanelWeb } from "@/components/account/web/AccountPrivacyPanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { Redirect } from "expo-router";

export default function AccountPrivacyScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={{ pathname: "/", params: { account: "privacy" } }} />;
  }
  return (
    <AccountShell title="Privacidad de fotos" showBack loading={false}>
      <AccountPrivacyPanelWeb />
    </AccountShell>
  );
}
