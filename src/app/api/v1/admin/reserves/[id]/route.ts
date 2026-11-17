import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson, parseParam } from "@/lib/api/parse";
import { idSchema } from "@/validation/common";
import { updateReserveSchema } from "@/validation/reserve";
import { deleteReserve, getAdmin, toReserveDTO, updateReserve } from "@/services/reserve.service";

type P = { id: string };

export const GET = adminRoute<P>(async ({ params, db }) => {
  return ok(toReserveDTO(await getAdmin(db, parseParam(params.id, idSchema, "id"))));
});

export const PATCH = adminRoute<P>(async ({ req, params, db, admin }) => {
  const id = parseParam(params.id, idSchema, "id");
  const input = await parseJson(req, updateReserveSchema);
  return ok(toReserveDTO(await updateReserve(db, id, input, admin.adminUserId)));
});

export const DELETE = adminRoute<P>(async ({ params, db, admin }) => {
  await deleteReserve(db, parseParam(params.id, idSchema, "id"), admin.adminUserId);
  return ok({ deleted: true });
});
