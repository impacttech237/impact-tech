/* Connexion : code reçu par email, ou demandé sur WhatsApp. Pour WhatsApp,
   le client confirme le numéro enregistré dans sa fiche : Impact Tech
   reçoit alors le code prêt à lui envoyer. 5 tentatives par heure. */
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../api";
import { t } from "../i18n";
import { whatsappLink } from "../state";
import { Button, ErrorBox, Icon } from "../ui";

export function Login({ accessKey, info, onLogged }: { accessKey: string; info: any; onLogged: () => void }) {
  const [step, setStep] = useState<"start" | "phone" | "code">("start");
  const [email, setEmail] = useState(""); // renseigné seulement après un envoi réel
  const [phone, setPhone] = useState("");
  const [waPhone, setWaPhone] = useState(""); // numéro masqué, après une demande acceptée
  const [waAuto, setWaAuto] = useState(false); // code parti automatiquement
  const phoneRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const canEmail = info?.hasEmail && info?.emailEnabled;
  const wa = whatsappLink(info?.whatsapp, `${t("login_whatsapp_text")} (${location.href})`);
  const waPing = whatsappLink(info?.whatsapp, t("login_wa_ping_text", { name: info?.firstName || "" }));
  // Sans numéro dans la fiche, on garde l'ancien chemin : écrire à Impact Tech.
  const askWhatsapp = () => (info?.hasPhone ? (setError(""), setStep("phone")) : window.open(wa, "_blank", "noopener"));

  useEffect(() => {
    if (step === "code") setTimeout(() => inputRef.current?.focus(), 50);
    if (step === "phone") setTimeout(() => phoneRef.current?.focus(), 50);
  }, [step]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const r = await api("/request-code", { body: { key: accessKey } });
      setEmail(r.email);
      setStep("code");
      setCooldown(45);
    } catch (e: any) {
      setError(e.message);
      if (e.code === "too_soon") setStep("code");
    } finally {
      setBusy(false);
    }
  }

  async function requestWhatsapp(e?: Event) {
    e?.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) return;
    setBusy(true);
    setError("");
    try {
      const r = await api("/request-code-whatsapp", { body: { key: accessKey, phone } });
      setWaPhone(r.phone);
      setWaAuto(!!r.auto);
      if (r.auto) setCooldown(45);
      setEmail("");
      setStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: Event) {
    e?.preventDefault();
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      await api("/verify-code", { body: { key: accessKey, code: clean } });
      onLogged();
    } catch (err: any) {
      setError(err.message);
      setCode("");
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main class="pt-login">
      <div class="pt-login__box">
        <div class="pt-logo pt-logo--lg">
          impact<span>.</span>Tech
        </div>
        <div class="pt-login__lock">
          <Icon name="lock" size={22} />
        </div>
        <h1>{info?.firstName ? t("login_title", { name: info.firstName }) : t("login_title_anon")}</h1>
        <p class="pt-muted">{t("login_sub")}</p>

        {error && <ErrorBox message={error} />}

        {step === "start" && (
          <div class="pt-stack">
            {canEmail && (
              <Button size="lg" block icon="send" loading={busy} onClick={sendCode}>
                {t("login_send_code")}
              </Button>
            )}
            <Button size="lg" block variant={canEmail ? "secondary" : "primary"} icon="chat" onClick={askWhatsapp}>
              {t("login_whatsapp")}
            </Button>
            <button type="button" class="pt-link" onClick={() => setStep("code")}>
              {t("login_have_code")}
            </button>
          </div>
        )}

        {step === "phone" && (
          <form class="pt-stack" onSubmit={requestWhatsapp}>
            <label class="pt-label" for="pt-phone">
              {t("login_phone_label")}
            </label>
            <input
              id="pt-phone"
              ref={phoneRef}
              class="pt-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("login_phone_ph")}
              value={phone}
              onInput={(e: any) => setPhone(e.currentTarget.value)}
            />
            <p class="pt-muted pt-small">{t("login_phone_hint")}</p>
            <Button size="lg" block type="submit" icon="chat" loading={busy} disabled={phone.replace(/\D/g, "").length < 8}>
              {t("login_phone_submit")}
            </Button>
            <div class="pt-row pt-row--center pt-gap-lg">
              <button type="button" class="pt-link" onClick={() => (setError(""), setStep("start"))}>
                {t("back")}
              </button>
              <button type="button" class="pt-link" onClick={() => (setError(""), setStep("code"))}>
                {t("login_have_code")}
              </button>
            </div>
          </form>
        )}

        {step === "code" && (
          <form class="pt-stack" onSubmit={verify}>
            {email && <p class="pt-note">{t("login_code_sent", { email })}</p>}
            {waPhone && waAuto && <p class="pt-note">{t("login_wa_sent", { phone: waPhone })}</p>}
            {waPhone && !waAuto && (
              <div class="pt-stack">
                <p class="pt-note">{t("login_wa_requested", { phone: waPhone })}</p>
                <Button variant="secondary" block icon="chat" href={waPing} target="_blank">
                  {t("login_wa_ping")}
                </Button>
              </div>
            )}
            <label class="pt-sr" for="pt-code">
              {t("login_enter_code")}
            </label>
            <input
              id="pt-code"
              ref={inputRef}
              class="pt-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={7}
              placeholder="••••••"
              value={code}
              onInput={(e: any) => {
                const v = e.currentTarget.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6) setTimeout(() => (document.getElementById("pt-code-submit") as HTMLButtonElement)?.click(), 0);
              }}
            />
            <Button id="pt-code-submit" size="lg" block type="submit" loading={busy} disabled={code.length !== 6}>
              {t("login_verify")}
            </Button>
            <div class="pt-row pt-row--center pt-gap-lg">
              {canEmail && (
                <button type="button" class="pt-link" disabled={cooldown > 0 || busy} onClick={sendCode}>
                  {t("login_resend")}
                  {cooldown > 0 ? ` (${cooldown}s)` : ""}
                </button>
              )}
              <button type="button" class="pt-link" disabled={waAuto && cooldown > 0} onClick={askWhatsapp}>
                WhatsApp{waAuto && cooldown > 0 ? ` (${cooldown}s)` : ""}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
