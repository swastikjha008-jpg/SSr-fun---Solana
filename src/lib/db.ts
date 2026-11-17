import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

/** Either the root client or an interactive-transaction client. */
export type Db = Prisma.TransactionClient;

const globalForDb = globalThis as unknown as { __ssrPrisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForDb.__ssrPrisma) {
    const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL, max: Number(process.env.DB_POOL_MAX) || 5 });
    globalForDb.__ssrPrisma = new PrismaClient({ adapter });
  }
  return globalForDb.__ssrPrisma;
}

export async function disconnectDb(): Promise<void> {
  if (globalForDb.__ssrPrisma) {
    await globalForDb.__ssrPrisma.$disconnect();
    globalForDb.__ssrPrisma = undefined;
  }
}
