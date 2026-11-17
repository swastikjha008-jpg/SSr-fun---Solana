import { revalidatePath } from "next/cache";
import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";

/** Lets the owner console refresh the cached public landing page right after a change. */
export const POST = adminRoute(async () => {
  revalidatePath("/");
  return ok({ revalidated: true });
});
