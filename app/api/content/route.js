/* GET /api/content — contenu public complet du site (issu de D1) */
import { getContent } from "@/lib/content";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getContent();
  return Response.json(content, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
