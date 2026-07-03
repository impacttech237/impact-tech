/* ------------------------------------------------------------------
   Accès à la base D1 (Cloudflare) + variables d'environnement.
   - En production (Cloudflare Pages) : binding "DB" via wrangler.toml
   - En local (`next dev` sans wrangler) : renvoie null → le site
     retombe sur lib/defaults.js et les API répondent en mode dégradé.
------------------------------------------------------------------- */

export async function getCloudflareEnv() {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    return getRequestContext().env ?? null;
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
