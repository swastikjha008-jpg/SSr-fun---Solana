import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson, parseQuery } from "@/lib/api/parse";
import { createFeedbackSchema, listFeedbackQuery } from "@/validation/feedback";
import { createFeedback, listAdmin, toFeedbackDTO } from "@/services/feedback.service";

export const GET = adminRoute(async ({ req, db }) => {
  const { status, category, priority, ...page } = parseQuery(req, listFeedbackQuery);
  const { items, meta } = await listAdmin(db, page, { status, category, priority });
  return ok(items, { meta });
});

export const POST = adminRoute(async ({ req, db, admin }) => {
  const input = await parseJson(req, createFeedbackSchema);
  return ok(toFeedbackDTO(await createFeedback(db, input, admin.adminUserId)), { status: 201 });
});
