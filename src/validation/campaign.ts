import { z } from "zod";
import { emptyToNull, solanaAddress, xHandle, xPostUrl } from "./common";

export const updateCampaignSchema = z
  .object({
    walletAddress: z.preprocess(emptyToNull, solanaAddress.nullable()),
    xHandle: z.preprocess(emptyToNull, xHandle.nullable()),
    campaignSignupConfirmed: z.boolean(),
    reserveOrTradeCompleted: z.boolean(),
    officialXFollowConfirmed: z.boolean(),
    investmentPostUrl: z.preprocess(emptyToNull, xPostUrl.nullable()),
    feedbackSubmissionConfirmed: z.boolean(),
    earnSubmissionConfirmed: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "at least one field is required");

export type UpdateCampaignInput = z.output<typeof updateCampaignSchema>;
