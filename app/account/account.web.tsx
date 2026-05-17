import { AccountShell } from "@/components/account/AccountShell";
import { AccountDetailsPanelWeb } from "@/components/account/web/AccountDetailsPanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { type Href, Redirect } from "expo-router";

export default function AccountAccountScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={"/app?account=details" as Href} />;
  }
  return (
    <AccountShell title="Cuenta" showBack loading={false}>
      <AccountDetailsPanelWeb />
    </AccountShell>
  );
}
