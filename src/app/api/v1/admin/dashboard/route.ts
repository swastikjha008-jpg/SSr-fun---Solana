import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getDashboard } from "@/services/dashboard.service";

export const GET = adminRoute(async ({ db }) => ok(await getDashboard(db)));
