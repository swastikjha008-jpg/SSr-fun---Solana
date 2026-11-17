import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson, parseQuery } from "@/lib/api/parse";
import { createReserveSchema, listReservesQuery } from "@/validation/reserve";
import { createReserve, listAdmin, toReserveDTO } from "@/services/reserve.service";

export const GET = adminRoute(async ({ req, db }) => {
  const { status, ...page } = parseQuery(req, listReservesQuery);
  const { items, meta } = await listAdmin(db, page, status);
  return ok(items, { meta });
});

export const POST = adminRoute(async ({ req, db, admin }) => {
  const input = await parseJson(req, createReserveSchema);
  const created = await createReserve(db, input, admin.adminUserId);
  return ok(toReserveDTO(created), { status: 201 });
});
