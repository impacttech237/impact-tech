/* Aide : nous joindre (WhatsApp, appel, RDV), installation, coffre d'accès,
   visite guidée, guide de chaque page et questions fréquentes. */
import { useEffect, useState } from "preact/hooks";
import { t } from "../i18n";
import { usePortal, whatsappLink } from "../state";
import { Button, Card, Icon } from "../ui";
import { GuideLibrary } from "./Guide";
import { VaultForm, VaultList } from "./Vault";

let deferredInstall: any = null;
window.addEventListener("beforeinstallprompt", (e: any) => {
  e.preventDefault();
  deferredInstall = e;
});

export function Help() {
  const { me, person, settings, projectId, dash } = usePortal();
  const [canInstall, setCanInstall] = useState(!!deferredInstall);
  const [vaultKey, setVaultKey] = useState(0);
  useEffect(() => {
    const on = () => setCanInstall(true);
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  // Prérempli via le stockage local (même origine) : pas de données perso dans l'URL.
  const bookCall = () => {
    try {
      localStorage.setItem("it-rdv-prefill", JSON.stringify({ name: person.name, email: person.email, phone: person.phone, company: me.company }));
    } catch {}
  };

  return (
    <div class="pt-page">
      <h1 class="pt-h1">{t("help_title")}</h1>
      <p class="pt-muted">{t("help_sub")}</p>
      <div class="pt-stack">
        {settings.whatsapp && (
          <Button size="lg" block icon="chat" href={whatsappLink(settings.whatsapp, `Bonjour, c'est ${person.name} (${dash?.project?.title || ""}).`)} target="_blank">
            {t("help_whatsapp")}
          </Button>
        )}
        {settings.whatsapp && (
          <Button size="lg" block variant="secondary" icon="phone" href={`tel:+${settings.whatsapp}`}>
            {t("help_call")} · {settings.phone}
          </Button>
        )}
        <Button size="lg" block variant="secondary" icon="cal" href="/rdv" target="_blank" onClick={bookCall}>
          {t("help_book")}
        </Button>
      </div>

      {canInstall && (
        <Card>
          <h2 class="pt-h3">{t("help_install")}</h2>
          <p class="pt-muted pt-small">{t("help_install_sub")}</p>
          <Button
            class="pt-mt"
            icon="mobile"
            onClick={async () => {
              deferredInstall?.prompt();
              await deferredInstall?.userChoice;
              deferredInstall = null;
              setCanInstall(false);
            }}
          >
            {t("help_install")}
          </Button>
        </Card>
      )}

      {projectId && person.rights.vault && (
        <section>
          <h2 class="pt-h2">
            <Icon name="lock" size={18} /> {t("vault_title")}
          </h2>
          <p class="pt-muted pt-small">{t("vault_sub")}</p>
          <VaultList key={vaultKey} projectId={projectId} />
          <Card class="pt-mt">
            <VaultForm projectId={projectId} onSaved={() => setVaultKey(vaultKey + 1)} />
          </Card>
        </section>
      )}

      <GuideLibrary />
    </div>
  );
}
