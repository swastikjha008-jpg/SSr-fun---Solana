import { NextRequest } from "next/server";

export const APP_ORIGIN = "http://localhost:3000";

type Handler = (req: NextRequest, ctx: { params: Promise<never> }) => Promise<Response>;

export interface CallOptions {
  body?: unknown;
  cookie?: string;
  origin?: string | null;
  ip?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export function makeRequest(method: string, path: string, opts: CallOptions = {}) {
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (opts.cookie) headers.set("cookie", opts.cookie);
  const origin = opts.origin === undefined ? APP_ORIGIN : opts.origin;
  if (origin && method !== "GET") headers.set("origin", origin);
  if (opts.ip) headers.set("x-forwarded-for", opts.ip);
  const body = opts.body === undefined ? undefined : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  return new NextRequest(`${APP_ORIGIN}${path}`, { method, headers, body });
}

export async function call(handler: unknown, method: string, path: string, opts: CallOptions = {}) {
  const res = await (handler as Handler)(makeRequest(method, path, opts), {
    params: Promise.resolve(opts.params ?? {}) as Promise<never>,
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}
