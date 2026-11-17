import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "./errors";
import { fail } from "./response";
import { ZodError } from "zod";
import { zodDetails } from "./parse";
import { assertSameOrigin, isMutating } from "@/lib/auth/origin";
import { requireAdmin, type AdminContext } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import type { PrismaClient } from "@/generated/prisma/client";

export interface RouteContext<P> {
  req: NextRequest;
  params: P;
  db: PrismaClient;
  admin: AdminContext | null;
}

type Segment<P> = { params: Promise<P> };

function prismaCode(e: unknown): string | null {
  if (typeof e === "object" && e && (e as { name?: string }).name === "PrismaClientKnownRequestError") {
    return (e as { code?: string }).code ?? null;
  }
  return null;
}

/** Centralised error mapping. Never leaks stack traces or internal messages. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof ApiError) return fail(e.status, e.code, e.message, e.details, e.headers);
  if (e instanceof ZodError) return fail(400, "VALIDATION_ERROR", "Request validation failed", zodDetails(e));
  const code = prismaCode(e);
  if (code === "P2002") return fail(409, "CONFLICT", "A record with these unique values already exists");
  if (code === "P2025") return fail(404, "NOT_FOUND", "Resource not found");
  if (code === "P2003") return fail(409, "CONFLICT", "Related record constraint failed");
  // Log a safe summary only (no request data, no stack).
  console.error("[api] unhandled error", { name: (e as Error)?.name, code, message: (e as Error)?.message?.slice(0, 200) });
  return fail(500, "INTERNAL_ERROR", "Something went wrong");
}

interface RouteOptions {
  /** Requires a valid admin session. Admin routes are also never cached. */
  admin?: boolean;
}

export function createRoute<P = Record<string, never>>(
  options: RouteOptions,
  fn: (ctx: RouteContext<P>) => Promise<NextResponse>,
) {
  return async (req: NextRequest, segment: Segment<P>): Promise<NextResponse> => {
    try {
      // Origin check applies to every state-changing request, including login.
      if (isMutating(req.method)) assertSameOrigin(req);
      const params = await segment.params;
      const admin = options.admin ? await requireAdmin(req) : null;
      const res = await fn({ req, params, db: getDb(), admin });
      if (options.admin || isMutating(req.method)) res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (e) {
      const res = handleError(e);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  };
}

export const publicRoute = <P = Record<string, never>>(fn: (ctx: RouteContext<P>) => Promise<NextResponse>) =>
  createRoute<P>({}, fn);

export const adminRoute = <P = Record<string, never>>(fn: (ctx: RouteContext<P> & { admin: AdminContext }) => Promise<NextResponse>) =>
  createRoute<P>({ admin: true }, (ctx) => fn(ctx as RouteContext<P> & { admin: AdminContext }));
