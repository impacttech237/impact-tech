/* POST /api/contact — enregistre une demande de devis dans D1 */
import { getDB } from "@/lib/db";


export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const message = (body.message || "").trim();

  if (!name || !phone || !message) {
    return Response.json(
      { ok: false, error: "Nom, téléphone et message sont obligatoires." },
      { status: 400 }
    );
  }

  const db = await getDB();
  if (!db) {
    // Dev local sans D1 : on accepte pour ne pas bloquer les tests du formulaire
    return Response.json({ ok: true, simulated: true });
  }

  try {
    await db
      .prepare(
        "INSERT INTO contact_requests (name, phone, email, company, project_type, budget, message) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        name.slice(0, 200),
        phone.slice(0, 50),
        (body.email || "").trim().slice(0, 200),
        (body.company || "").trim().slice(0, 200),
        (body.type || "").trim().slice(0, 100),
        (body.budget || "").trim().slice(0, 100),
        message.slice(0, 5000)
      )
      .run();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/contact:", e?.message);
    return Response.json({ ok: false, error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
