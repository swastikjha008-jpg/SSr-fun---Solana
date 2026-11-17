import { z } from "zod";
import type { PageMeta } from "./response";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const skipTake = (p: Pagination) => ({ skip: (p.page - 1) * p.pageSize, take: p.pageSize });

export function buildMeta(p: Pagination, total: number): PageMeta {
  return { page: p.page, pageSize: p.pageSize, total, totalPages: Math.max(1, Math.ceil(total / p.pageSize)) };
}
