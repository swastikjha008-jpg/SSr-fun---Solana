import bcrypt from "bcryptjs";
import { getEnv } from "@/lib/env";
import { safeEqual } from "./crypto";

/**
 * Verifies the single configured administrator. The bcrypt comparison always runs so
 * response time does not reveal whether the email matched.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const env = getEnv();
  const emailOk = safeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL);
  const passwordOk = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  return emailOk && passwordOk;
}
