import { AccountShell } from "@/components/account/AccountShell";
import { AccountDetailsPanelWeb } from "@/components/account/web/AccountDetailsPanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { Redirect } from "expo-router";

export default function AccountAccountScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={{ pathname: "/", params: { account: "details" } }} />;
  }
  return (
    <AccountShell title="Cuenta" showBack loading={false}>
      <AccountDetailsPanelWeb />
    </AccountShell>
  );
}
