import { z } from "zod";
import { emptyToNull, httpsUrl, shortText, slugSchema, solanaAddress } from "./common";
import { paginationSchema } from "@/lib/api/pagination";

const status = z.enum(["DRAFT", "PUBLISHED"]);

export const createReserveSchema = z
  .object({
    name: shortText(80),
    slug: slugSchema.optional(),
    description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional()),
    reserveUrl: z.preprocess(emptyToNull, httpsUrl.nullable().optional()),
    walletAddress: z.preprocess(emptyToNull, solanaAddress.nullable().optional()),
    publicationStatus: status.default("DRAFT"),
  })
  .strict();

export const updateReserveSchema = z
  .object({
    name: shortText(80),
    slug: slugSchema,
    description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
    reserveUrl: z.preprocess(emptyToNull, httpsUrl.nullable()),
    walletAddress: z.preprocess(emptyToNull, solanaAddress.nullable()),
    publicationStatus: status,
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "at least one field is required");

export const listReservesQuery = paginationSchema.extend({ status: status.optional() });

export type CreateReserveInput = z.output<typeof createReserveSchema>;
export type UpdateReserveInput = z.output<typeof updateReserveSchema>;
