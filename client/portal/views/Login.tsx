/* Connexion : code reçu par email, ou demandé sur WhatsApp. */
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../api";
import { t } from "../i18n";
import { whatsappLink } from "../state";
import { Button, ErrorBox, Icon } from "../ui";

export function Login({ accessKey, info, onLogged }: { accessKey: string; info: any; onLogged: () => void }) {
  const [step, setStep] = useState<"start" | "code">("start");
  const [email, setEmail] = useState(""); // renseigné seulement après un envoi réel
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const canEmail = info?.hasEmail && info?.emailEnabled;
  const wa = whatsappLink(info?.whatsapp, `${t("login_whatsapp_text")} (${location.href})`);

  useEffect(() => {
    if (step === "code") setTimeout(() => inputRef.current?.focus(), 50);
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
            <Button size="lg" block variant={canEmail ? "secondary" : "primary"} href={wa} target="_blank" icon="chat">
              {t("login_whatsapp")}
            </Button>
            <button type="button" class="pt-link" onClick={() => setStep("code")}>
              {t("login_have_code")}
            </button>
          </div>
        )}

        {step === "code" && (
          <form class="pt-stack" onSubmit={verify}>
            {email && <p class="pt-note">{t("login_code_sent", { email })}</p>}
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
              <a class="pt-link" href={wa} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
