/* Réglages du portail : emails, WhatsApp, parrainage, avis clients. */
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, LoadingSpinner, Textarea } from "../ui";
import { CheckCircle, Gift, Mail, Star } from "../../lib/icons";
import { ErrorText, fmtAgo, papi, useLoad } from "./shared";

export default function PortalSettings() {
  const { data, error, reload } = useLoad("settings");
  const [f, setF] = useState(null);
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    if (data) setF({ portal_whatsapp: data.settings.portal_whatsapp || "", referral_reward: data.settings.referral_reward || "" });
  }, [data]);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data || !f) return <LoadingSpinner />;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card padding="p-5" className="space-y-3">
        <h3 className="flex items-center gap-2 font-head text-base font-semibold text-adm-text">
          <Mail size={16} /> Emails du portail
        </h3>
        {data.email.configured ? (
          <p className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle size={16} /> Configuré — expéditeur : {data.email.from}
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <p className="font-semibold">Non configuré : aucun email ne part (codes, rappels, notifications).</p>
            <ol className="list-decimal space-y-1 pl-5 text-amber-100/90">
              <li>Créer un compte gratuit sur resend.com (3 000 emails/mois).</li>
              <li>Domains → Add domain → impacttech237.com, puis ajouter les 3 enregistrements DNS proposés dans Cloudflare (DNS).</li>
              <li>API Keys → Create → copier la clé.</li>
              <li>
                Dans un terminal : <code className="rounded bg-black/30 px-1">npx wrangler secret put RESEND_API_KEY</code> et coller la clé.
              </li>
            </ol>
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          loading={busy === "test"}
          onClick={async () => {
            setBusy("test");
            const r = await papi("settings/test-email", "POST").catch((e) => ({ ok: false, error: e.message }));
            setTest(r);
            setBusy("");
          }}
        >
          Envoyer un email de test à impacttech237@gmail.com
        </Button>
        {test && <p className={`text-sm ${test.ok ? "text-emerald-400" : "text-amber-400"}`}>{test.ok ? "Email envoyé ✓ (vérifiez la boîte de réception)" : test.error}</p>}
        <p className="text-xs text-adm-text-3">
          Paiement Mobile Money : {data.kpay ? <Badge variant="success">K-PAY actif</Badge> : <Badge variant="danger">K-PAY non configuré</Badge>} · Coffre d'accès :{" "}
          {data.vaultKey ? "clé dédiée" : "chiffré avec AUTH_SECRET"}
        </p>
      </Card>

      <Card padding="p-5" className="space-y-3">
        <h3 className="flex items-center gap-2 font-head text-base font-semibold text-adm-text">
          <Gift size={16} /> WhatsApp & parrainage
        </h3>
        <Input label="Numéro WhatsApp du portail" value={f.portal_whatsapp} onChange={(e) => setF({ ...f, portal_whatsapp: e.target.value })} placeholder={data.settings.phone_link} />
        <p className="text-xs text-adm-text-3">Vide = numéro du site ({data.settings.phone_link}). Utilisé pour le bouton « Nous écrire » et la demande de code.</p>
        <Textarea
          label="Récompense de parrainage (affichée au client)"
          value={f.referral_reward}
          onChange={(e) => setF({ ...f, referral_reward: e.target.value })}
          placeholder="Ex : Recommandez-nous : si votre filleul signe, vous gagnez 1 mois de maintenance offert."
        />
        <Button
          loading={busy === "save"}
          onClick={async () => {
            setBusy("save");
            await papi("settings", "PUT", f);
            setBusy("");
            reload();
          }}
        >
          Enregistrer
        </Button>
        <Referrals />
      </Card>

      <Reviews />
    </div>
  );
}

function Referrals() {
  const { data } = useLoad("referrals");
  if (!data) return null;
  return (
    <div className="border-t border-adm-border pt-3">
      <p className="mb-2 text-sm font-semibold text-adm-text">Demandes reçues par parrainage ({data.referrals.length})</p>
      {!data.referrals.length ? (
        <p className="text-xs text-adm-text-3">Aucune pour l'instant. Chaque client a son lien de parrainage dans son espace (après la livraison).</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {data.referrals.map((r) => (
            <li key={r.id} className="text-adm-text-2">
              <span className="text-adm-text">{r.name}</span> ({r.phone}) — parrainé par <strong>{r.referrer_name}</strong> · {fmtAgo(r.created_at)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Reviews() {
  const { data, reload } = useLoad("reviews");
  const [err, setErr] = useState("");
  if (!data) return null;
  return (
    <Card padding="p-5" className="space-y-3 xl:col-span-2">
      <h3 className="flex items-center gap-2 font-head text-base font-semibold text-adm-text">
        <Star size={16} /> Avis clients
      </h3>
      <ErrorText>{err}</ErrorText>
      {!data.reviews.length ? (
        <p className="text-sm text-adm-text-3">Aucun avis. Demandez-en un depuis l'onglet « Livraison » d'un projet livré.</p>
      ) : (
        <ul className="space-y-3">
          {data.reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-adm-border bg-adm-surface-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-adm-text">
                  {r.client_name} {r.client_company && <span className="font-normal text-adm-text-3">· {r.client_company}</span>} <span className="text-amber-400">{"★".repeat(r.rating)}</span>
                </span>
                {r.testimonial_id ? (
                  <Badge variant="success">Publié sur le site</Badge>
                ) : r.allow_publish ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await papi(`reviews/${r.id}/publish`, "POST");
                        reload();
                      } catch (e) {
                        setErr(e.message);
                      }
                    }}
                  >
                    Publier en témoignage
                  </Button>
                ) : (
                  <Badge>Publication non autorisée</Badge>
                )}
              </div>
              {r.text && <p className="mt-1 whitespace-pre-wrap text-sm text-adm-text-2">« {r.text} »</p>}
              <p className="text-[11px] text-adm-text-3">
                {r.project_title} · {fmtAgo(r.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
