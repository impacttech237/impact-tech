/* ------------------------------------------------------------------
   Google Calendar — OAuth2 + API Calendar v3
   Secrets Workers requis : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
------------------------------------------------------------------- */

interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

interface OAuthTokenRow {
  id: number;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  attendees?: string[];
}

const SCOPES = "https://www.googleapis.com/auth/calendar";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

/* ── OAuth2 helpers ── */

export function getAuthUrl(env: Env, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  if (state) params.set("state", state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(env: Env, code: string, redirectUri: string): Promise<void> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "OAuth exchange failed");

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

  const existing = await env.DB.prepare("SELECT id FROM oauth_tokens WHERE provider = 'google'").first();
  if (existing) {
    await env.DB.prepare(
      `UPDATE oauth_tokens SET access_token = ?, refresh_token = COALESCE(?, refresh_token),
       expires_at = ?, scope = ?, updated_at = datetime('now') WHERE provider = 'google'`
    ).bind(data.access_token, data.refresh_token || null, expiresAt, data.scope || SCOPES).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO oauth_tokens (provider, access_token, refresh_token, expires_at, scope)
       VALUES ('google', ?, ?, ?, ?)`
    ).bind(data.access_token, data.refresh_token || null, expiresAt, data.scope || SCOPES).run();
  }
}

async function getValidToken(env: Env): Promise<string | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM oauth_tokens WHERE provider = 'google' LIMIT 1"
  ).first<OAuthTokenRow>();
  if (!row) return null;

  if (row.expires_at && new Date(row.expires_at) > new Date(Date.now() + 60_000)) {
    return row.access_token;
  }

  if (!row.refresh_token) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: row.refresh_token,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  const data: any = await res.json();
  if (!res.ok) return null;

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
  await env.DB.prepare(
    "UPDATE oauth_tokens SET access_token = ?, expires_at = ?, updated_at = datetime('now') WHERE provider = 'google'"
  ).bind(data.access_token, expiresAt).run();

  return data.access_token;
}

export async function isConnected(env: Env): Promise<boolean> {
  const token = await getValidToken(env);
  return !!token;
}

export async function disconnect(env: Env): Promise<void> {
  const row = await env.DB.prepare(
    "SELECT access_token FROM oauth_tokens WHERE provider = 'google' LIMIT 1"
  ).first<{ access_token: string }>();

  if (row) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${row.access_token}`, {
      method: "POST",
    }).catch(() => {});
  }
  await env.DB.prepare("DELETE FROM oauth_tokens WHERE provider = 'google'").run();
}

/* ── Calendar API ── */

async function gcalFetch(env: Env, path: string, options: RequestInit = {}): Promise<any> {
  const token = await getValidToken(env);
  if (!token) throw new Error("Google Calendar non connecté");

  const res = await fetch(`${CALENDAR_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error?.message || `GCal API error ${res.status}`);
  return data;
}

export async function getFreeBusy(
  env: Env,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
): Promise<{ start: string; end: string }[]> {
  const data = await gcalFetch(env, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: "Africa/Douala",
      items: [{ id: calendarId }],
    }),
  });

  const busy = data.calendars?.[calendarId]?.busy || [];
  return busy.map((b: any) => ({ start: b.start, end: b.end }));
}

export async function createEvent(
  env: Env,
  event: CalendarEvent,
  calendarId = "primary"
): Promise<string> {
  const body: any = {
    summary: event.summary,
    description: event.description || "",
    location: event.location || "",
    start: { dateTime: event.start, timeZone: "Africa/Douala" },
    end: { dateTime: event.end, timeZone: "Africa/Douala" },
  };
  if (event.attendees?.length) {
    body.attendees = event.attendees.map((email) => ({ email }));
  }

  const data = await gcalFetch(env, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.id;
}

export async function deleteEvent(
  env: Env,
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  const token = await getValidToken(env);
  if (!token) return;

  await fetch(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
