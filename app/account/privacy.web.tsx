import { AccountShell } from "@/components/account/AccountShell";
import { AccountPrivacyPanelWeb } from "@/components/account/web/AccountPrivacyPanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { type Href, Redirect } from "expo-router";

export default function AccountPrivacyScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={"/app?account=privacy" as Href} />;
  }
  return (
    <AccountShell title="Privacidad de fotos" showBack loading={false}>
      <AccountPrivacyPanelWeb />
    </AccountShell>
  );
}
