import { z } from "zod";
import { emptyToNull, httpsUrl, shortText } from "./common";
import { paginationSchema } from "@/lib/api/pagination";

export const categorySchema = z.enum(["UX_OBSERVATION", "BUG_REPORT", "FEATURE_REQUEST", "IMPROVEMENT_SUGGESTION"]);
export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const statusSchema = z.enum(["OBSERVED", "DOCUMENTED", "SUBMITTED_EXTERNALLY", "RESOLVED"]);

const optionalLong = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const externalFields = {
  /** Must be true when moving a record to SUBMITTED_EXTERNALLY: the owner confirms they submitted it in the SSR.FUN app. */
  externalSubmissionConfirmed: z.boolean().optional(),
  externalSubmittedAt: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  externalReference: optionalLong(200),
};

export const createFeedbackSchema = z
  .object({
    title: shortText(160),
    description: shortText(8000),
    category: categorySchema,
    priority: prioritySchema.default("MEDIUM"),
    status: statusSchema.default("OBSERVED"),
    reproductionSteps: optionalLong(8000),
    evidenceUrl: z.preprocess(emptyToNull, httpsUrl.nullable().optional()),
    isPublic: z.boolean().default(false),
    ...externalFields,
  })
  .strict();

export const updateFeedbackSchema = z
  .object({
    title: shortText(160),
    description: shortText(8000),
    category: categorySchema,
    priority: prioritySchema,
    status: statusSchema,
    reproductionSteps: z.preprocess(emptyToNull, z.string().trim().max(8000).nullable()),
    evidenceUrl: z.preprocess(emptyToNull, httpsUrl.nullable()),
    isPublic: z.boolean(),
    ...externalFields,
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "at least one field is required");

export const listFeedbackQuery = paginationSchema.extend({
  status: statusSchema.optional(),
  category: categorySchema.optional(),
  priority: prioritySchema.optional(),
});

export type CreateFeedbackInput = z.output<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.output<typeof updateFeedbackSchema>;
