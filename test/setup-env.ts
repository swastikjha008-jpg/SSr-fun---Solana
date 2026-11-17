import bcrypt from "bcryptjs";

export const TEST_ADMIN_EMAIL = "admin@test.local";
export const TEST_ADMIN_PASSWORD = "correct horse battery staple";

process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
process.env.ADMIN_EMAIL = TEST_ADMIN_EMAIL;
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(TEST_ADMIN_PASSWORD, 4);
process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough-0123456789";
process.env.SOLANA_RPC_URL = "https://rpc.test.invalid";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.DB_POOL_MAX = "1";
