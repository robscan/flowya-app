import { AccountShell } from "@/components/account/AccountShell";
import { AccountLanguagePanelWeb } from "@/components/account/web/AccountLanguagePanel.web";
import { useExploreDesktopSidebarActive } from "@/hooks/use-explore-desktop-sidebar-active";
import { type Href, Redirect } from "expo-router";

export default function AccountLanguageScreenWeb() {
  const exploreDesktop = useExploreDesktopSidebarActive();
  if (exploreDesktop) {
    return <Redirect href={"/app?account=language" as Href} />;
  }
  return (
    <AccountShell title="Idioma" showBack>
      <AccountLanguagePanelWeb />
    </AccountShell>
  );
}
