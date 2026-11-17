// Fail fast at server start (not at build time) when configuration is invalid.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  }
}
