import { publicRoute } from "@/lib/api/handler";
import { ok, PUBLIC_CACHE } from "@/lib/api/response";
import { parseParam } from "@/lib/api/parse";
import { slugSchema } from "@/validation/common";
import { getPublishedBySlug, toReserveDTO } from "@/services/reserve.service";

export const GET = publicRoute<{ slug: string }>(async ({ params, db }) => {
  const slug = parseParam(params.slug, slugSchema, "slug");
  return ok(toReserveDTO(await getPublishedBySlug(db, slug)), { headers: { "Cache-Control": PUBLIC_CACHE } });
});
