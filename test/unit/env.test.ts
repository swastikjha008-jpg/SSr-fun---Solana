import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { parseEnv } from "@/lib/env";

const hash = bcrypt.hashSync("whatever-password", 4);
const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  ADMIN_EMAIL: "Owner@Real-Domain.io",
  ADMIN_PASSWORD_HASH: hash,
  SESSION_SECRET: "x".repeat(48),
  NEXT_PUBLIC_APP_URL: "https://app.real-domain.io",
};

describe("environment validation", () => {
  it("accepts a valid configuration, normalises the email and defaults the RPC URL", () => {
    const env = parseEnv({ ...base, NODE_ENV: "production" });
    expect(env.ADMIN_EMAIL).toBe("owner@real-domain.io");
    expect(env.SOLANA_RPC_URL).toContain("mainnet");
  });

  it("names the missing variable without echoing secret values", () => {
    const { SESSION_SECRET: _omit, ...rest } = base;
    void _omit;
    expect(() => parseEnv({ ...rest, ADMIN_PASSWORD_HASH: hash })).toThrow(/SESSION_SECRET/);
    try {
      parseEnv({ ...rest, ADMIN_PASSWORD_HASH: hash });
    } catch (e) {
      expect(String(e)).not.toContain(hash);
    }
  });

  it("rejects short secrets, non-bcrypt hashes and non-postgres URLs", () => {
    expect(() => parseEnv({ ...base, SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/);
    expect(() => parseEnv({ ...base, ADMIN_PASSWORD_HASH: "plaintext" })).toThrow(/ADMIN_PASSWORD_HASH/);
    expect(() => parseEnv({ ...base, DATABASE_URL: "mysql://x" })).toThrow(/DATABASE_URL/);
  });

  it("rejects placeholder values and http URLs in production only", () => {
    expect(() => parseEnv({ ...base, NODE_ENV: "production", SESSION_SECRET: "GENERATE_WITH_" + "x".repeat(40) })).toThrow(/placeholder/);
    expect(() => parseEnv({ ...base, NODE_ENV: "production", ADMIN_EMAIL: "admin@example.com" })).toThrow(/placeholder/);
    expect(() => parseEnv({ ...base, NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "http://app.real-domain.io" })).toThrow(/https/);
    expect(() => parseEnv({ ...base, NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" })).not.toThrow();
  });
});
