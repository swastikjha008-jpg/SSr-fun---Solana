import { NextResponse } from "next/server";
import type { ErrorDetail } from "./errors";

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function ok<T>(data: T, opts: { status?: number; meta?: PageMeta; headers?: Record<string, string> } = {}) {
  const body: { success: true; data: T; meta?: PageMeta } = { success: true, data };
  if (opts.meta) body.meta = opts.meta;
  return NextResponse.json(body, { status: opts.status ?? 200, headers: opts.headers });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: ErrorDetail[],
  headers?: Record<string, string>,
) {
  const error: { code: string; message: string; details?: ErrorDetail[] } = { code, message };
  if (details?.length) error.details = details;
  return NextResponse.json({ success: false, error }, { status, headers });
}

export const PUBLIC_CACHE = "public, s-maxage=30, stale-while-revalidate=120";
