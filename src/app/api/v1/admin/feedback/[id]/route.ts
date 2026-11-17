import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson, parseParam } from "@/lib/api/parse";
import { idSchema } from "@/validation/common";
import { updateFeedbackSchema } from "@/validation/feedback";
import { deleteFeedback, getFeedback, toFeedbackDTO, updateFeedback } from "@/services/feedback.service";

type P = { id: string };

export const GET = adminRoute<P>(async ({ params, db }) => {
  return ok(toFeedbackDTO(await getFeedback(db, parseParam(params.id, idSchema, "id"))));
});

export const PATCH = adminRoute<P>(async ({ req, params, db, admin }) => {
  const id = parseParam(params.id, idSchema, "id");
  const input = await parseJson(req, updateFeedbackSchema);
  return ok(toFeedbackDTO(await updateFeedback(db, id, input, admin.adminUserId)));
});

export const DELETE = adminRoute<P>(async ({ params, db, admin }) => {
  await deleteFeedback(db, parseParam(params.id, idSchema, "id"), admin.adminUserId);
  return ok({ deleted: true });
});
