import type { ZodError, ZodTypeAny, z } from "zod";
import { ApiError, badRequest, type ErrorDetail } from "./errors";

export const MAX_BODY_BYTES = 64 * 1024;

export function zodDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

export async function parseJson<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json");
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body too large");
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body too large");

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw badRequest("Request body is not valid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw badRequest("Request validation failed", zodDetails(parsed.error));
  return parsed.data;
}

export function parseQuery<S extends ZodTypeAny>(req: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw badRequest("Query validation failed", zodDetails(parsed.error));
  return parsed.data;
}

export function parseParam<S extends ZodTypeAny>(value: unknown, schema: S, name: string): z.output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw badRequest(`Invalid ${name}`);
  return parsed.data;
}
