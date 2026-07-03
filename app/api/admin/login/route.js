/* POST /api/admin/login — connexion au dashboard admin */
import { getAdminPassword, createSessionToken, sessionCookieHeader, DEFAULT_PASSWORD } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const password = body.password || "";
  const expected = await getAdminPassword();

  if (password !== expected) {
    return Response.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }

  const token = await createSessionToken();
  return Response.json(
    { ok: true, usingDefaultPassword: expected === DEFAULT_PASSWORD },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } }
  );
}
