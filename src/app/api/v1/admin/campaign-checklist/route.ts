import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseJson } from "@/lib/api/parse";
import { updateCampaignSchema } from "@/validation/campaign";
import { getChecklist, updateChecklist } from "@/services/campaign.service";

export const GET = adminRoute(async ({ db }) => ok(await getChecklist(db)));

export const PUT = adminRoute(async ({ req, db, admin }) => {
  const input = await parseJson(req, updateCampaignSchema);
  return ok(await updateChecklist(db, input, admin.adminUserId));
});
