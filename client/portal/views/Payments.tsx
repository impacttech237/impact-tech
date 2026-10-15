/* Devis et factures : accepter un devis, payer par Mobile Money, reçus. */
import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { fmtDate, fmtMoney, t } from "../i18n";
import { usePortal } from "../state";
import { Badge, Button, Card, Empty, ErrorBox, Icon, Skeleton, toast } from "../ui";

const TONE: Record<string, any> = { envoye: "amber", accepte: "blue", refuse: "default", paye: "green", annule: "default" };

export function Payments() {
  const { projectId, reloadDash, person } = usePortal();
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = () =>
    api(`/projects/${projectId}/invoices`)
      .then((r) => setList(r.invoices))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [projectId]);

  async function act(inv: any, action: "accept" | "refuse" | "pay") {
    let body: any = {};
    if (action === "refuse") {
      const reason = prompt(t("inv_refuse_reason"));
      if (reason === null) return;
      body = { reason };
    }
    setBusy(inv.id);
    try {
      const r = await api(`/invoices/${inv.id}/${action}`, { body });
      if (action === "pay" && r.gatewayUrl) {
        location.href = r.gatewayUrl;
        return;
      }
      toast(t("sent"));
      await load();
      reloadDash();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div class="pt-page">
      <h1 class="pt-h1">{t("pay_title")}</h1>
      <p class="pt-note">
        <Icon name="lock" size={14} /> {t("pay_guarantee")}
      </p>
      {error && <ErrorBox message={error} onRetry={load} />}
      {!list && !error && <Skeleton />}
      {list && !list.length && <Empty icon="money" title={t("pay_empty")} />}
      {list?.map((inv) => {
        const payable = (inv.kind === "facture" && inv.status === "envoye") || (inv.kind === "devis" && inv.status === "accepte");
        return (
          <Card key={inv.id} tone={inv.status === "envoye" ? "accent" : undefined}>
            <div class="pt-row pt-row--between pt-gap pt-wrap">
              <span class="pt-eyebrow">
                {t(inv.kind === "devis" ? "inv_devis" : "inv_facture")} · {inv.number}
              </span>
              <Badge tone={TONE[inv.status]}>{t(`inv_${inv.status}` as any)}</Badge>
            </div>
            <h2 class="pt-h3">{inv.title}</h2>
            <p class="pt-amount">{fmtMoney(inv.amount, inv.currency)}</p>
            {inv.items?.length > 1 && (
              <ul class="pt-lines">
                {inv.items.map((it: any, i: number) => (
                  <li key={i}>
                    <span>
                      {it.label}
                      {it.qty > 1 ? ` × ${it.qty}` : ""}
                    </span>
                    <span>{fmtMoney(it.qty * it.unit, inv.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
            {inv.status === "envoye" && inv.due_date && <p class="pt-small pt-muted">{t("inv_due", { date: fmtDate(inv.due_date) })}</p>}
            {((inv.kind === "devis" && inv.status === "envoye" && !person.rights.decide) || (payable && !person.rights.pay)) && <p class="pt-small pt-muted">{t(inv.kind === "devis" && inv.status === "envoye" ? "right_decide" : "right_pay")}</p>}
            <div class="pt-row pt-gap pt-wrap pt-mt">
              {inv.kind === "devis" && inv.status === "envoye" && person.rights.decide && (
                <>
                  <Button variant="success" icon="check" loading={busy === inv.id} onClick={() => act(inv, "accept")}>
                    {t("inv_accept")}
                  </Button>
                  <Button variant="ghost" onClick={() => act(inv, "refuse")}>
                    {t("inv_refuse_btn")}
                  </Button>
                </>
              )}
              {payable && inv.currency !== "EUR" && person.rights.pay && (
                <Button icon="money" loading={busy === inv.id} onClick={() => act(inv, "pay")}>
                  {t("inv_pay")}
                </Button>
              )}
              <Button variant="ghost" icon="doc" href={`/api/portal/invoices/${inv.id}/pdf`} target="_blank">
                {t("inv_view")}
              </Button>
              {inv.status === "paye" && (
                <Button variant="secondary" icon="download" href={`/api/portal/invoices/${inv.id}/pdf?receipt=1&download=1`}>
                  {t("inv_receipt")}
                </Button>
              )}
            </div>
            {payable && inv.currency !== "EUR" && <p class="pt-small pt-muted pt-mt">{t("inv_pay_hint")}</p>}
          </Card>
        );
      })}
    </div>
  );
}
