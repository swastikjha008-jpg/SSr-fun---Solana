import { z } from "zod";
import { adminRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/parse";
import { solanaAddress } from "@/validation/common";
import { getWalletStatus } from "@/lib/solana";

const query = z.object({ address: solanaAddress });

/** Read-only public RPC lookup. Admin-only so the RPC endpoint cannot be abused anonymously. */
export const GET = adminRoute(async ({ req }) => {
  const { address } = parseQuery(req, query);
  return ok(await getWalletStatus(address));
});
