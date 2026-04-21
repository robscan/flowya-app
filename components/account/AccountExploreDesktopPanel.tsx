/**
 * Perfil en la columna lateral de Explore (web ≥1080): mismo host que welcome/países/spot.
 */

import { AccountShell } from "@/components/account/AccountShell";
import { AccountDetailsPanelWeb } from "@/components/account/web/AccountDetailsPanel.web";
import { AccountHomePanelWeb } from "@/components/account/web/AccountHomePanel.web";
import { AccountLanguagePanelWeb } from "@/components/account/web/AccountLanguagePanel.web";
import { AccountPrivacyPanelWeb } from "@/components/account/web/AccountPrivacyPanel.web";
import { AccountTagsPanelWeb } from "@/components/account/web/AccountTagsPanel.web";
import type { AccountDesktopPanelKey } from "@/lib/explore/account-desktop-query";
import { useRouter } from "expo-router";

export type AccountExploreDesktopPanelProps = {
  panel: AccountDesktopPanelKey;
};

export function AccountExploreDesktopPanel({ panel }: AccountExploreDesktopPanelProps) {
  const router = useRouter();

  const closeEntirePanel = () => {
    (router.setParams as (p: Record<string, string | undefined>) => void)({ account: "" });
  };

  const backToProfileHome = () => {
    router.setParams({ account: "profile" });
  };

  switch (panel) {
    case "profile":
      return (
        <AccountShell
          layout="embedded"
          title="Perfil"
          showBack={false}
          loading={false}
          onEmbeddedClosePanel={closeEntirePanel}
        >
          <AccountHomePanelWeb />
        </AccountShell>
      );
    case "details":
      return (
        <AccountShell
          layout="embedded"
          title="Cuenta"
          showBack
          loading={false}
          onEmbeddedClosePanel={closeEntirePanel}
          onEmbeddedBack={backToProfileHome}
        >
          <AccountDetailsPanelWeb />
        </AccountShell>
      );
    case "privacy":
      return (
        <AccountShell
          layout="embedded"
          title="Privacidad de fotos"
          showBack
          loading={false}
          onEmbeddedClosePanel={closeEntirePanel}
          onEmbeddedBack={backToProfileHome}
        >
          <AccountPrivacyPanelWeb />
        </AccountShell>
      );
    case "tags":
      return (
        <AccountShell
          layout="embedded"
          title="Etiquetas"
          showBack
          loading={false}
          onEmbeddedClosePanel={closeEntirePanel}
          onEmbeddedBack={backToProfileHome}
        >
          <AccountTagsPanelWeb />
        </AccountShell>
      );
    case "language":
      return (
        <AccountShell
          layout="embedded"
          title="Idioma"
          showBack
          loading={false}
          onEmbeddedClosePanel={closeEntirePanel}
          onEmbeddedBack={backToProfileHome}
        >
          <AccountLanguagePanelWeb />
        </AccountShell>
      );
    default:
      return null;
  }
}
