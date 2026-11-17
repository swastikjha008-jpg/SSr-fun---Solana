import { z } from "zod";
import { emptyToNull, shortText, xPostUrl } from "./common";

export const upsertThesisSchema = z
  .object({
    title: shortText(160),
    philosophy: shortText(8000),
    investmentRationale: shortText(8000),
    strategy: shortText(8000),
    riskDisclosure: shortText(8000),
    xPostUrl: z.preprocess(emptyToNull, xPostUrl.nullable().optional()),
  })
  .strict();

export type UpsertThesisInput = z.output<typeof upsertThesisSchema>;
