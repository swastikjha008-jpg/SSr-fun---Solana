import { Connection, PublicKey } from "@solana/web3.js";
import { getEnv } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";

/** Syntactic validation of a public key (base58, 32 bytes). Does not prove the account exists. */
export function isValidSolanaAddress(value: string): boolean {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) return false;
  try {
    return new PublicKey(value).toBytes().length === 32;
  } catch {
    return false;
  }
}

export interface WalletStatus {
  address: string;
  network: "solana-mainnet";
  exists: boolean;
  lamports: number | null;
  owner: string | null;
  executable: boolean | null;
  source: "solana-rpc";
  fetchedAt: string;
  note: string;
}

const RPC_TIMEOUT_MS = 8_000;

/**
 * Read-only public RPC lookup. Never signs, never sends transactions, never stores results.
 * An address with no on-chain account is valid but "does not exist" yet (unfunded wallet).
 */
export async function getWalletStatus(address: string): Promise<WalletStatus> {
  if (!isValidSolanaAddress(address)) throw new ApiError(400, "VALIDATION_ERROR", "Invalid Solana address");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const connection = new Connection(getEnv().SOLANA_RPC_URL, "confirmed");
    const info = await Promise.race([
      connection.getAccountInfo(new PublicKey(address)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("rpc timeout")), RPC_TIMEOUT_MS);
      }),
    ]);
    return {
      address,
      network: "solana-mainnet",
      exists: info !== null,
      lamports: info ? Number(info.lamports) : null,
      owner: info ? info.owner.toBase58() : null,
      executable: info ? info.executable : null,
      source: "solana-rpc",
      fetchedAt: new Date().toISOString(),
      note: "Read-only RPC lookup of public account data. This does not verify SSR.FUN registration, Reserves, volume, or PnL.",
    };
  } catch {
    throw new ApiError(502, "UPSTREAM_ERROR", "Solana RPC request failed");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
