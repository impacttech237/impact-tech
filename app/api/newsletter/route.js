/* POST /api/newsletter — inscription à la newsletter */
import { getDB } from "@/lib/db";

export const runtime = "edge";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const db = await getDB();
  if (!db) return Response.json({ ok: true, simulated: true });

  try {
    await db
      .prepare("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)")
      .bind(email.slice(0, 200))
      .run();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/newsletter:", e?.message);
    return Response.json({ ok: false, error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
