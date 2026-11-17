import { z } from "zod";
import { isValidSolanaAddress } from "@/lib/solana";

export const idSchema = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, "invalid id");
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, digits and single hyphens only");

export const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((u) => u.startsWith("https://"), "must be an https:// URL");

const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);

/** https://x.com/<handle>/status/<id> (twitter.com accepted). */
export const xPostUrl = httpsUrl.refine((u) => {
  try {
    const url = new URL(u);
    return X_HOSTS.has(url.hostname) && /^\/[A-Za-z0-9_]{1,15}\/status\/\d+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}, "must be an X post URL like https://x.com/<handle>/status/<id>");

export const solanaAddress = z
  .string()
  .trim()
  .refine(isValidSolanaAddress, "must be a valid Solana public address");

/** Accepts "@handle" or "handle"; normalises to "handle". */
export const xHandle = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, ""))
  .refine((v) => /^[A-Za-z0-9_]{1,15}$/.test(v), "must be a valid X handle (1-15 letters, digits or underscores)");

export const shortText = (max: number) => z.string().trim().min(1).max(max);

/** Empty string from a form is treated as "not provided". */
export const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
