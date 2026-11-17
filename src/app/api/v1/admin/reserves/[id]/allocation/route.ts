import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson, parseParam } from "@/lib/api/parse";
import { idSchema } from "@/validation/common";
import { replaceAllocationSchema } from "@/validation/portfolio";
import { getAdmin } from "@/services/reserve.service";
import { getAllocation, replaceAllocation } from "@/services/portfolio.service";

type P = { id: string };

export const GET = adminRoute<P>(async ({ params, db }) => {
  const reserve = await getAdmin(db, parseParam(params.id, idSchema, "id"));
  return ok(await getAllocation(db, reserve.id));
});

export const PUT = adminRoute<P>(async ({ req, params, db, admin }) => {
  const id = parseParam(params.id, idSchema, "id");
  const { assets } = await parseJson(req, replaceAllocationSchema);
  return ok(await replaceAllocation(db, id, assets, admin.adminUserId));
});
