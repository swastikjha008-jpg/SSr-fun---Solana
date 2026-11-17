import { publicRoute } from "@/lib/api/handler";
import { ok, PUBLIC_CACHE } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/pagination";
import { parseQuery } from "@/lib/api/parse";
import { listPublic } from "@/services/feedback.service";

/** Only records the owner explicitly marked isPublic. */
export const GET = publicRoute(async ({ req, db }) => {
  const page = parseQuery(req, paginationSchema);
  const { items, meta } = await listPublic(db, page);
  return ok(items, { meta, headers: { "Cache-Control": PUBLIC_CACHE } });
});
