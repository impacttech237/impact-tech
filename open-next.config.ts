import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuration par défaut : pas d'ISR/cache incrémental nécessaire,
// toutes les pages sont rendues à la demande depuis la base D1.
export default defineCloudflareConfig();
