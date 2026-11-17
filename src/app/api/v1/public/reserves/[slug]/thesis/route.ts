import { publicRoute } from "@/lib/api/handler";
import { ok, PUBLIC_CACHE } from "@/lib/api/response";
import { parseParam } from "@/lib/api/parse";
import { slugSchema } from "@/validation/common";
import { getPublishedBySlug } from "@/services/reserve.service";
import { getThesis, toThesisDTO } from "@/services/thesis.service";

export const GET = publicRoute<{ slug: string }>(async ({ params, db }) => {
  const slug = parseParam(params.slug, slugSchema, "slug");
  const reserve = await getPublishedBySlug(db, slug);
  return ok(toThesisDTO(await getThesis(db, reserve.id)), { headers: { "Cache-Control": PUBLIC_CACHE } });
});
