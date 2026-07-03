/* ------------------------------------------------------------------
   Accès à la base D1 (Cloudflare) + variables d'environnement.
   - En production (Workers via OpenNext) : binding "DB" de wrangler.toml
   - En local (`next dev`) : miniflare fournit une D1 locale vide →
     les tables n'existent pas, le site retombe sur lib/defaults.js.
------------------------------------------------------------------- */

export async function getCloudflareEnv() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return getCloudflareContext().env ?? null;
  } catch {
    return null;
  }
}

export async function getDB() {
  const env = await getCloudflareEnv();
  return env?.DB ?? null;
}

export async function getEnvVar(name, fallback = undefined) {
  const env = await getCloudflareEnv();
  if (env && env[name] !== undefined) return env[name];
  if (typeof process !== "undefined" && process.env?.[name] !== undefined) {
    return process.env[name];
  }
  return fallback;
}
