import { beforeEach, describe, expect, it, vi } from "vitest";

const getAccountInfo = vi.fn();
const rpcState = { failToConnect: false };
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return { ...actual, Connection: vi.fn(function () {
      if (rpcState.failToConnect) throw new Error("boom secret-rpc-key");
      return { getAccountInfo };
    }) };
});

import { getWalletStatus } from "@/lib/solana";
import { PublicKey } from "@solana/web3.js";

const ADDR = "So11111111111111111111111111111111111111112";

describe("read-only wallet status", () => {
  beforeEach(() => {
    getAccountInfo.mockReset();
    rpcState.failToConnect = false;
  });

  it("reports an existing account with provenance labels", async () => {
    getAccountInfo.mockResolvedValue({ lamports: 5, owner: new PublicKey("11111111111111111111111111111111"), executable: false });
    const s = await getWalletStatus(ADDR);
    expect(s).toMatchObject({ exists: true, lamports: 5, source: "solana-rpc", network: "solana-mainnet" });
    expect(s.note).toMatch(/does not verify SSR\.FUN/);
  });

  it("reports unfunded addresses as not existing rather than inventing data", async () => {
    getAccountInfo.mockResolvedValue(null);
    expect(await getWalletStatus(ADDR)).toMatchObject({ exists: false, lamports: null, owner: null });
  });

  it("rejects invalid addresses before any network call", async () => {
    await expect(getWalletStatus("nope")).rejects.toMatchObject({ status: 400 });
    expect(getAccountInfo).not.toHaveBeenCalled();
  });

  it("maps RPC failures to a generic 502 without leaking the upstream message", async () => {
    rpcState.failToConnect = true;
    const err = await getWalletStatus(ADDR).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 502, code: "UPSTREAM_ERROR" });
    expect((err as Error).message).not.toMatch(/secret-rpc-key/);
  });
});
