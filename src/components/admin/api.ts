import type { ApiResponse } from "@/shared/contracts";

export class ApiFailure extends Error {
  constructor(message: string, readonly details: { path: string; message: string }[] = []) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init?.method ?? "GET",
    credentials: "include",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiFailure(`Unexpected response (${res.status})`);
  }
  if (!json.success) {
    throw new ApiFailure(json.error.message, json.error.details ?? []);
  }
  // Refresh the cached public page after owner edits (best effort).
  const method = init?.method ?? "GET";
  if (method !== "GET" && !path.startsWith("/admin/auth") && !path.startsWith("/admin/revalidate")) {
    void fetch("/api/v1/admin/revalidate", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => undefined);
  }
  return json.data;
}

export function errorText(e: unknown): string {
  if (e instanceof ApiFailure) {
    const d = e.details.map((x) => `${x.path}: ${x.message}`).join("; ");
    return d ? `${e.message} (${d})` : e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}
