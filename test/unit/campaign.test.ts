import { describe, expect, it } from "vitest";
import { buildChecklist } from "@/services/campaign.service";
import type { CampaignChecklist as Row } from "@/generated/prisma/client";

const row = (over: Partial<Row> = {}): Row => ({
  id: "primary",
  walletAddress: null,
  xHandle: null,
  campaignSignupConfirmed: false,
  reserveOrTradeCompleted: false,
  officialXFollowConfirmed: false,
  investmentPostUrl: null,
  feedbackSubmissionConfirmed: false,
  earnSubmissionConfirmed: false,
  updatedAt: new Date("2026-11-15T00:00:00Z"),
  ...over,
});

describe("campaign checklist", () => {
  it("returns zero progress with a self-reported notice when nothing exists yet", () => {
    const c = buildChecklist(null);
    expect(c.progress).toEqual({ completed: 0, total: 6, percent: 0 });
    expect(c.updatedAt).toBeNull();
    expect(c.notice).toMatch(/self-reported/);
    expect(c.steps.every((s) => s.verification === "self_reported")).toBe(true);
  });

  it("counts the post step from the presence of a post URL", () => {
    const c = buildChecklist(row({ investmentPostUrl: "https://x.com/me/status/1" }));
    expect(c.steps.find((s) => s.key === "investmentPost")?.done).toBe(true);
    expect(c.progress.completed).toBe(1);
  });

  it("reports 100% only when all six steps are marked", () => {
    const c = buildChecklist(
      row({
        walletAddress: "11111111111111111111111111111111",
        xHandle: "me",
        campaignSignupConfirmed: true,
        reserveOrTradeCompleted: true,
        officialXFollowConfirmed: true,
        investmentPostUrl: "https://x.com/me/status/1",
        feedbackSubmissionConfirmed: true,
        earnSubmissionConfirmed: true,
      }),
    );
    expect(c.progress.percent).toBe(100);
    expect(c.warnings).toEqual([]);
  });

  it("warns on inconsistent self-reports instead of silently accepting them", () => {
    const c = buildChecklist(row({ earnSubmissionConfirmed: true, campaignSignupConfirmed: true }));
    expect(c.warnings.some((w) => /Superteam Earn/.test(w))).toBe(true);
    expect(c.warnings.some((w) => /wallet address/.test(w))).toBe(true);
  });
});
