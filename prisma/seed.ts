/**
 * Seeds ONE clearly-labelled ILLUSTRATIVE draft Reserve profile so the frontend has something
 * to render during development. It is a DRAFT with no reserveUrl, so it is never publicly
 * visible and cannot be published until the owner links a real SSR.FUN Reserve.
 * No PnL, volume, prices or transactions are seeded because none are invented anywhere.
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const SLUG = "illustrative-demo-reserve";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    if (await db.reserveProfile.findUnique({ where: { slug: SLUG } })) {
      console.log("Seed already applied; nothing to do.");
      return;
    }
    await db.reserveProfile.create({
      data: {
        name: "Illustrative Demo Reserve",
        slug: SLUG,
        description: "ILLUSTRATIVE EXAMPLE ONLY. Replace with your real Reserve details before publishing.",
        publicationStatus: "DRAFT",
        assets: {
          create: [
            { name: "Example Large-Cap Crypto", symbol: "EXA", assetType: "CRYPTO", allocationBps: 4000, dataProvenance: "ILLUSTRATIVE", sortOrder: 0 },
            { name: "Example Tokenized Stock", symbol: "EXB", assetType: "TOKENIZED_STOCK", allocationBps: 3500, dataProvenance: "ILLUSTRATIVE", sortOrder: 1 },
            { name: "Example ETF", symbol: "EXC", assetType: "ETF", allocationBps: 2500, dataProvenance: "ILLUSTRATIVE", sortOrder: 2 },
          ],
        },
        thesis: {
          create: {
            title: "Illustrative thesis (placeholder)",
            philosophy: "Placeholder text. Describe your investment philosophy.",
            investmentRationale: "Placeholder text. Explain why each asset belongs in the Reserve.",
            strategy: "Placeholder text. Describe how the portfolio is constructed and managed.",
            riskDisclosure: "Placeholder text. Describe market, liquidity, smart-contract and concentration risks.",
          },
        },
      },
    });
    console.log("Seeded illustrative draft Reserve:", SLUG);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
