import { AccountShell } from "@/components/account/AccountShell";
import { AccountLanguagePanelWeb } from "@/components/account/web/AccountLanguagePanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { Redirect } from "expo-router";

export default function AccountLanguageScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={{ pathname: "/", params: { account: "language" } }} />;
  }
  return (
    <AccountShell title="Idioma" showBack>
      <AccountLanguagePanelWeb />
    </AccountShell>
  );
}
