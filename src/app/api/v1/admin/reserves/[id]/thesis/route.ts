import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson, parseParam } from "@/lib/api/parse";
import { idSchema } from "@/validation/common";
import { upsertThesisSchema } from "@/validation/thesis";
import { getAdmin } from "@/services/reserve.service";
import { getThesis, toThesisDTO, upsertThesis } from "@/services/thesis.service";

type P = { id: string };

export const GET = adminRoute<P>(async ({ params, db }) => {
  const reserve = await getAdmin(db, parseParam(params.id, idSchema, "id"));
  return ok(toThesisDTO(await getThesis(db, reserve.id)));
});

export const PUT = adminRoute<P>(async ({ req, params, db, admin }) => {
  const id = parseParam(params.id, idSchema, "id");
  const input = await parseJson(req, upsertThesisSchema);
  const { thesis, created } = await upsertThesis(db, id, input, admin.adminUserId);
  return ok(toThesisDTO(thesis), { status: created ? 201 : 200 });
});
