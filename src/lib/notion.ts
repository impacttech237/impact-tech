/* ------------------------------------------------------------------
   Synchronise chaque demande de devis vers Notion (base "CRM —
   Prospects & Clients") en creant un nouveau prospect. Best-effort :
   une erreur Notion ne doit jamais faire echouer la soumission du
   formulaire (deja stockee en D1 a ce stade).
------------------------------------------------------------------- */
const CRM_DATABASE_ID = "ad9212b8-d31a-8286-b591-01364a2e6f8d";

const OFFER_TO_PACK = {
  "Impact Vitrine": "Présence",
  "Impact Gestion": "Plateforme",
  "Impact Signature": "Sur-mesure",
};

const OFFER_TO_VALUE = {
  "Impact Vitrine": 150000,
  "Impact Gestion": 400000,
};

export async function syncContactToNotion(env, data) {
  const token = env.NOTION_TOKEN;
  if (!token) return;

  const properties = {
    Nom: { title: [{ text: { content: data.name.slice(0, 200) } }] },
    Téléphone: { phone_number: data.phone || null },
    Statut: { select: { name: "Nouveau" } },
    Type: { select: { name: "Prospect" } },
    Source: { select: { name: "Autre" } },
    "Prochaine action": { rich_text: [{ text: { content: "Répondre à la demande de devis du site web" } }] },
  };

  if (data.email) properties.Email = { email: data.email };
  if (data.company) properties.Activité = { rich_text: [{ text: { content: data.company.slice(0, 2000) } }] };

  const pack = OFFER_TO_PACK[data.type];
  if (pack) properties["Pack visé"] = { select: { name: pack } };

  const value = OFFER_TO_VALUE[data.type];
  if (value) properties["Valeur (FCFA)"] = { number: value };

  const notesParts = [];
  if (data.type) notesParts.push(`Offre demandée : ${data.type}`);
  if (data.budget) notesParts.push(`Budget indiqué : ${data.budget}`);
  notesParts.push("", "Message :", data.message);
  properties.Notes = { rich_text: [{ text: { content: notesParts.join("\n").slice(0, 2000) } }] };

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parent: { database_id: CRM_DATABASE_ID }, properties }),
    });
    if (!res.ok) {
      console.error("syncContactToNotion:", res.status, await res.text());
    }
  } catch (e) {
    console.error("syncContactToNotion:", e?.message);
  }
}
