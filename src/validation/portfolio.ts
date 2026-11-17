import { z } from "zod";
import { emptyToNull, httpsUrl, shortText } from "./common";

export const ALLOCATION_TOTAL_BPS = 10_000;

export const assetInputSchema = z
  .object({
    name: shortText(80),
    symbol: z
      .string()
      .trim()
      .min(1)
      .max(16)
      .regex(/^[A-Za-z0-9._-]+$/, "letters, digits, '.', '_' or '-' only")
      .transform((s) => s.toUpperCase()),
    assetType: z.enum(["CRYPTO", "TOKENIZED_STOCK", "ETF", "OTHER"]),
    allocationBps: z.number().int("must be an integer number of basis points").min(1).max(ALLOCATION_TOTAL_BPS),
    dataProvenance: z.enum(["ILLUSTRATIVE", "OWNER_ENTERED", "VERIFIED_EXTERNAL"]).default("OWNER_ENTERED"),
    sourceUrl: z.preprocess(emptyToNull, httpsUrl.nullable().optional()),
  })
  .strict();

export const replaceAllocationSchema = z
  .object({ assets: z.array(assetInputSchema).max(50) })
  .strict();

export type AssetInput = z.output<typeof assetInputSchema>;
