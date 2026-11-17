import { z } from "zod";

const PLACEHOLDER = /(GENERATE_WITH|changeme|change-me|example\.com|your[-_]?secret)/i;

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z
      .string()
      .min(1)
      .refine((v) => /^postgres(ql)?:\/\//.test(v), "must be a postgres:// or postgresql:// URL"),
    ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
    ADMIN_PASSWORD_HASH: z
      .string()
      .regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, "must be a bcrypt hash (run `pnpm hash-password`)"),
    SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),
    SOLANA_RPC_URL: z.string().url().default("https://api.mainnet-beta.solana.com"),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    if (PLACEHOLDER.test(env.SESSION_SECRET)) {
      ctx.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "placeholder value not allowed in production" });
    }
    if (PLACEHOLDER.test(env.ADMIN_EMAIL)) {
      ctx.addIssue({ code: "custom", path: ["ADMIN_EMAIL"], message: "placeholder value not allowed in production" });
    }
    if (!env.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
      ctx.addIssue({ code: "custom", path: ["NEXT_PUBLIC_APP_URL"], message: "must use https in production" });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`);
    // Names and reasons only: never echo values (they may be secrets).
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}

export function getEnv(): Env {
  if (!cached) cached = parseEnv(process.env);
  return cached;
}

/** Test helper. */
export function resetEnvCache(): void {
  cached = null;
}
