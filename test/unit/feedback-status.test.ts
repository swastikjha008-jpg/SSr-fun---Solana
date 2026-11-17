import { describe, expect, it } from "vitest";
import { resolveFeedbackStatus } from "@/services/feedback.service";

const now = new Date("2026-11-15T12:00:00Z");
const fresh = { status: "OBSERVED" as const, externalSubmittedAt: null, externalReference: null };
const submitted = { status: "SUBMITTED_EXTERNALLY" as const, externalSubmittedAt: new Date("2026-11-10T00:00:00Z"), externalReference: "ref-1" };

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

describe("external feedback submission rule", () => {
  it("refuses SUBMITTED_EXTERNALLY without explicit confirmation", () => {
    expect(code(() => resolveFeedbackStatus(fresh, { status: "SUBMITTED_EXTERNALLY" }, now))).toBe("EXTERNAL_SUBMISSION_NOT_CONFIRMED");
    expect(code(() => resolveFeedbackStatus(null, { status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: false }, now))).toBe("EXTERNAL_SUBMISSION_NOT_CONFIRMED");
  });

  it("accepts confirmation, defaulting the date to now and keeping a supplied reference", () => {
    const r = resolveFeedbackStatus(fresh, { status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: true, externalReference: "ticket-9" }, now);
    expect(r).toEqual({ status: "SUBMITTED_EXTERNALLY", externalSubmittedAt: now, externalReference: "ticket-9" });
  });

  it("honours a supplied past date but rejects a future one", () => {
    const past = new Date("2026-11-01T00:00:00Z");
    expect(resolveFeedbackStatus(fresh, { status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: true, externalSubmittedAt: past }, now).externalSubmittedAt).toEqual(past);
    const future = new Date("2026-12-01T00:00:00Z");
    expect(code(() => resolveFeedbackStatus(fresh, { status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: true, externalSubmittedAt: future }, now))).toBe("INVALID_SUBMISSION_DATE");
  });

  it("does not require re-confirmation for edits to an already-submitted record", () => {
    const r = resolveFeedbackStatus(submitted, { status: "SUBMITTED_EXTERNALLY" }, now);
    expect(r.externalSubmittedAt).toEqual(submitted.externalSubmittedAt);
    expect(r.externalReference).toBe("ref-1");
  });

  it("blocks external fields on non-submitted statuses", () => {
    expect(code(() => resolveFeedbackStatus(fresh, { status: "DOCUMENTED", externalSubmissionConfirmed: true }, now))).toBe("EXTERNAL_FIELDS_REQUIRE_SUBMITTED_STATUS");
    expect(code(() => resolveFeedbackStatus(fresh, { externalReference: "x" }, now))).toBe("EXTERNAL_FIELDS_REQUIRE_SUBMITTED_STATUS");
  });

  it("forbids moving a submitted record back to an earlier status", () => {
    expect(code(() => resolveFeedbackStatus(submitted, { status: "OBSERVED" }, now))).toBe("INVALID_STATUS_TRANSITION");
    expect(code(() => resolveFeedbackStatus(submitted, { status: "DOCUMENTED" }, now))).toBe("INVALID_STATUS_TRANSITION");
  });

  it("preserves submission evidence when resolving, and never invents it", () => {
    expect(resolveFeedbackStatus(submitted, { status: "RESOLVED" }, now).externalSubmittedAt).toEqual(submitted.externalSubmittedAt);
    expect(resolveFeedbackStatus(fresh, { status: "RESOLVED" }, now).externalSubmittedAt).toBeNull();
  });

  it("keeps ordinary status moves free of external data", () => {
    expect(resolveFeedbackStatus(fresh, { status: "DOCUMENTED" }, now)).toEqual({ status: "DOCUMENTED", externalSubmittedAt: null, externalReference: null });
    expect(resolveFeedbackStatus(null, {}, now).status).toBe("OBSERVED");
  });
});
