/* Aide (WhatsApp, appel, RDV, coffre, installation) + accueil guidé. */
import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { t } from "../i18n";
import { usePortal, whatsappLink } from "../state";
import { Button, Card, Icon } from "../ui";
import { VaultForm, VaultList } from "./Vault";

let deferredInstall: any = null;
window.addEventListener("beforeinstallprompt", (e: any) => {
  e.preventDefault();
  deferredInstall = e;
});

export function Help() {
  const { me, settings, projectId, dash } = usePortal();
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
      localStorage.setItem("it-rdv-prefill", JSON.stringify({ name: me.name, email: me.email, phone: me.phone, company: me.company }));
    } catch {}
  };

  return (
    <div class="pt-page">
      <h1 class="pt-h1">{t("help_title")}</h1>
      <p class="pt-muted">{t("help_sub")}</p>
      <div class="pt-stack">
        {settings.whatsapp && (
          <Button size="lg" block icon="chat" href={whatsappLink(settings.whatsapp, `Bonjour, c'est ${me.name} (${dash?.project?.title || ""}).`)} target="_blank">
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

      {projectId && (
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
    </div>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slides = [
    { icon: "home", title: t("onb_1_title"), text: t("onb_1_text") },
    { icon: "todo", title: t("onb_2_title"), text: t("onb_2_text") },
    { icon: "chat", title: t("onb_3_title"), text: t("onb_3_text") },
  ];
  const finish = () => {
    api("/me/onboarded", { body: {} }).catch(() => {});
    onDone();
  };
  const s = slides[i];
  return (
    <div class="pt-onb" role="dialog" aria-modal="true" aria-label={s.title}>
      <div class="pt-onb__card">
        <div class="pt-onb__icon">
          <Icon name={s.icon} size={34} />
        </div>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        <div class="pt-onb__dots" aria-hidden="true">
          {slides.map((_, k) => (
            <span key={k} class={k === i ? "is-on" : ""} />
          ))}
        </div>
        <Button size="lg" block onClick={() => (i < slides.length - 1 ? setI(i + 1) : finish())}>
          {i < slides.length - 1 ? t("onb_next") : t("onb_start")}
        </Button>
        {i < slides.length - 1 && (
          <button type="button" class="pt-link pt-mt" onClick={finish}>
            {t("onb_skip")}
          </button>
        )}
      </div>
    </div>
  );
}
