import { ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/** Liveness only: no database or secrets touched. */
export async function GET() {
  return ok({ status: "ok", time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
