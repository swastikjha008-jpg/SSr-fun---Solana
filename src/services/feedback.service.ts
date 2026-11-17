import type { BetaFeedback as FeedbackRow, FeedbackStatus, PrismaClient, Prisma } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { notFound, unprocessable } from "@/lib/api/errors";
import { buildMeta, skipTake, type Pagination } from "@/lib/api/pagination";
import type { CreateFeedbackInput, UpdateFeedbackInput } from "@/validation/feedback";
import type { BetaFeedback } from "@/shared/contracts";
import { recordAudit } from "./audit.service";

export const toFeedbackDTO = (f: FeedbackRow): BetaFeedback => ({
  id: f.id,
  title: f.title,
  description: f.description,
  category: f.category,
  priority: f.priority,
  status: f.status,
  reproductionSteps: f.reproductionSteps,
  evidenceUrl: f.evidenceUrl,
  isPublic: f.isPublic,
  externalSubmission: f.externalSubmittedAt
    ? { submittedAt: f.externalSubmittedAt.toISOString(), reference: f.externalReference, verification: "self_reported" }
    : null,
  createdAt: f.createdAt.toISOString(),
  updatedAt: f.updatedAt.toISOString(),
});

export interface CurrentExternalState {
  status: FeedbackStatus;
  externalSubmittedAt: Date | null;
  externalReference: string | null;
}

export interface StatusChangeInput {
  status?: FeedbackStatus;
  externalSubmissionConfirmed?: boolean;
  externalSubmittedAt?: Date | null;
  externalReference?: string | null;
}

export interface ResolvedStatus {
  status: FeedbackStatus;
  externalSubmittedAt: Date | null;
  externalReference: string | null;
}

const CLOCK_SKEW_MS = 5 * 60_000;

/**
 * Enforces the rule that a database record is NOT proof of an SSR.FUN submission:
 * SUBMITTED_EXTERNALLY can only be set when the owner explicitly confirms the in-app submission.
 * The confirmation is always labelled self-reported; this app cannot verify it.
 */
export function resolveFeedbackStatus(
  current: CurrentExternalState | null,
  input: StatusChangeInput,
  now: Date = new Date(),
): ResolvedStatus {
  const target = input.status ?? current?.status ?? "OBSERVED";
  const alreadySubmitted = current?.externalSubmittedAt != null;
  const suppliedExternal =
    input.externalSubmissionConfirmed !== undefined ||
    input.externalSubmittedAt !== undefined ||
    input.externalReference !== undefined;

  if (alreadySubmitted && (target === "OBSERVED" || target === "DOCUMENTED")) {
    throw unprocessable(
      "INVALID_STATUS_TRANSITION",
      "A record confirmed as submitted externally cannot move back to an earlier status.",
      [{ path: "status", message: `cannot change from ${current!.status} to ${target}` }],
    );
  }

  const mayCarryExternal = target === "SUBMITTED_EXTERNALLY" || (target === "RESOLVED" && alreadySubmitted);
  if (suppliedExternal && !mayCarryExternal) {
    throw unprocessable(
      "EXTERNAL_FIELDS_REQUIRE_SUBMITTED_STATUS",
      "External submission fields can only be set when status is SUBMITTED_EXTERNALLY.",
      [{ path: "externalSubmissionConfirmed", message: "not allowed for this status" }],
    );
  }

  if (target === "SUBMITTED_EXTERNALLY" && !alreadySubmitted && input.externalSubmissionConfirmed !== true) {
    throw unprocessable(
      "EXTERNAL_SUBMISSION_NOT_CONFIRMED",
      "Set externalSubmissionConfirmed to true to confirm you submitted this feedback through the SSR.FUN in-app feedback button.",
      [{ path: "externalSubmissionConfirmed", message: "must be true to use status SUBMITTED_EXTERNALLY" }],
    );
  }

  if (!mayCarryExternal) return { status: target, externalSubmittedAt: null, externalReference: null };

  const submittedAt = input.externalSubmittedAt ?? current?.externalSubmittedAt ?? now;
  if (submittedAt.getTime() > now.getTime() + CLOCK_SKEW_MS) {
    throw unprocessable("INVALID_SUBMISSION_DATE", "externalSubmittedAt cannot be in the future.", [
      { path: "externalSubmittedAt", message: "must not be in the future" },
    ]);
  }
  const reference = input.externalReference !== undefined ? input.externalReference : (current?.externalReference ?? null);
  return { status: target, externalSubmittedAt: submittedAt, externalReference: reference };
}

/* ------------------------------ queries ------------------------------ */

export async function listPublic(db: Db, page: Pagination) {
  const where = { isPublic: true };
  const [rows, total] = await Promise.all([
    db.betaFeedback.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(page) }),
    db.betaFeedback.count({ where }),
  ]);
  return { items: rows.map(toFeedbackDTO), meta: buildMeta(page, total) };
}

export async function listAdmin(
  db: Db,
  page: Pagination,
  filter: { status?: FeedbackStatus; category?: FeedbackRow["category"]; priority?: FeedbackRow["priority"] },
) {
  const where: Prisma.BetaFeedbackWhereInput = {
    ...(filter.status && { status: filter.status }),
    ...(filter.category && { category: filter.category }),
    ...(filter.priority && { priority: filter.priority }),
  };
  const [rows, total] = await Promise.all([
    db.betaFeedback.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(page) }),
    db.betaFeedback.count({ where }),
  ]);
  return { items: rows.map(toFeedbackDTO), meta: buildMeta(page, total) };
}

export async function getFeedback(db: Db, id: string): Promise<FeedbackRow> {
  const row = await db.betaFeedback.findUnique({ where: { id } });
  if (!row) throw notFound("Feedback");
  return row;
}

export async function createFeedback(db: PrismaClient, input: CreateFeedbackInput, adminUserId: string) {
  const resolved = resolveFeedbackStatus(null, input);
  return db.$transaction(async (tx) => {
    const created = await tx.betaFeedback.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: resolved.status,
        reproductionSteps: input.reproductionSteps ?? null,
        evidenceUrl: input.evidenceUrl ?? null,
        isPublic: input.isPublic,
        externalSubmittedAt: resolved.externalSubmittedAt,
        externalReference: resolved.externalReference,
      },
    });
    await recordAudit(tx, { adminUserId, action: "feedback.create", entityType: "BetaFeedback", entityId: created.id });
    return created;
  });
}

export async function updateFeedback(db: PrismaClient, id: string, input: UpdateFeedbackInput, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.betaFeedback.findUnique({ where: { id } });
    if (!existing) throw notFound("Feedback");
    const resolved = resolveFeedbackStatus(existing, input);
    const updated = await tx.betaFeedback.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: resolved.status,
        reproductionSteps: input.reproductionSteps,
        evidenceUrl: input.evidenceUrl,
        isPublic: input.isPublic,
        externalSubmittedAt: resolved.externalSubmittedAt,
        externalReference: resolved.externalReference,
      },
    });
    const action =
      resolved.status !== existing.status ? "feedback.status_change" : "feedback.update";
    await recordAudit(tx, { adminUserId, action, entityType: "BetaFeedback", entityId: id });
    return updated;
  });
}

export async function deleteFeedback(db: PrismaClient, id: string, adminUserId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.betaFeedback.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw notFound("Feedback");
    await tx.betaFeedback.delete({ where: { id } });
    await recordAudit(tx, { adminUserId, action: "feedback.delete", entityType: "BetaFeedback", entityId: id });
  });
}
