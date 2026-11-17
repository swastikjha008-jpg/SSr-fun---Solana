import type { PrismaClient, ReserveProfile } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { conflict, notFound, unprocessable } from "@/lib/api/errors";
import { buildMeta, skipTake, type Pagination } from "@/lib/api/pagination";
import type { CreateReserveInput, UpdateReserveInput } from "@/validation/reserve";
import type { Reserve } from "@/shared/contracts";
import { recordAudit } from "./audit.service";
import { NETWORK } from "@/config/campaign";

export function toReserveDTO(r: ReserveProfile): Reserve {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    reserveUrl: r.reserveUrl,
    walletAddress: r.walletAddress,
    network: r.network,
    publicationStatus: r.publicationStatus,
    provenance: "owner_entered",
    isOnChainRecord: false,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function slugify(input: string): string {
  const s = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55)
    .replace(/-+$/g, "");
  return s || "reserve";
}

async function uniqueSlug(db: Db, base: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i < 100; i++) {
    const hit = await db.reserveProfile.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit) return candidate;
    candidate = `${base}-${i}`;
  }
  throw conflict("Could not generate a unique slug; provide one explicitly", "SLUG_UNAVAILABLE");
}

export function assertPublishable(r: { publicationStatus: string; reserveUrl: string | null }): void {
  if (r.publicationStatus === "PUBLISHED" && !r.reserveUrl) {
    throw unprocessable(
      "RESERVE_URL_REQUIRED_TO_PUBLISH",
      "A published Reserve profile must link to the Reserve on SSR.FUN (reserveUrl).",
      [{ path: "reserveUrl", message: "required when publicationStatus is PUBLISHED" }],
    );
  }
}

/* ----------------------------- public ----------------------------- */

export async function listPublished(db: Db, page: Pagination) {
  const where = { publicationStatus: "PUBLISHED" as const };
  const [rows, total] = await Promise.all([
    db.reserveProfile.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(page) }),
    db.reserveProfile.count({ where }),
  ]);
  return { items: rows.map(toReserveDTO), meta: buildMeta(page, total) };
}

export async function getPublishedBySlug(db: Db, slug: string): Promise<ReserveProfile> {
  const reserve = await db.reserveProfile.findFirst({ where: { slug, publicationStatus: "PUBLISHED" } });
  if (!reserve) throw notFound("Reserve");
  return reserve;
}

/* ------------------------------ admin ------------------------------ */

export async function listAdmin(db: Db, page: Pagination, status?: "DRAFT" | "PUBLISHED") {
  const where = status ? { publicationStatus: status } : {};
  const [rows, total] = await Promise.all([
    db.reserveProfile.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(page) }),
    db.reserveProfile.count({ where }),
  ]);
  return { items: rows.map(toReserveDTO), meta: buildMeta(page, total) };
}

export async function getAdmin(db: Db, id: string): Promise<ReserveProfile> {
  const reserve = await db.reserveProfile.findUnique({ where: { id } });
  if (!reserve) throw notFound("Reserve");
  return reserve;
}

export async function createReserve(db: PrismaClient, input: CreateReserveInput, adminUserId: string) {
  assertPublishable({ publicationStatus: input.publicationStatus, reserveUrl: input.reserveUrl ?? null });
  return db.$transaction(async (tx) => {
    let slug: string;
    if (input.slug) {
      const taken = await tx.reserveProfile.findUnique({ where: { slug: input.slug }, select: { id: true } });
      if (taken) throw conflict("Slug is already in use", "SLUG_TAKEN");
      slug = input.slug;
    } else {
      slug = await uniqueSlug(tx, slugify(input.name));
    }
    const created = await tx.reserveProfile.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        reserveUrl: input.reserveUrl ?? null,
        walletAddress: input.walletAddress ?? null,
        network: NETWORK,
        publicationStatus: input.publicationStatus,
      },
    });
    await recordAudit(tx, { adminUserId, action: "reserve.create", entityType: "ReserveProfile", entityId: created.id });
    return created;
  });
}

export async function updateReserve(db: PrismaClient, id: string, input: UpdateReserveInput, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.reserveProfile.findUnique({ where: { id } });
    if (!existing) throw notFound("Reserve");
    const merged = {
      publicationStatus: input.publicationStatus ?? existing.publicationStatus,
      reserveUrl: input.reserveUrl !== undefined ? input.reserveUrl : existing.reserveUrl,
    };
    assertPublishable(merged);
    if (input.slug && input.slug !== existing.slug) {
      const taken = await tx.reserveProfile.findUnique({ where: { slug: input.slug }, select: { id: true } });
      if (taken) throw conflict("Slug is already in use", "SLUG_TAKEN");
    }
    const updated = await tx.reserveProfile.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        reserveUrl: input.reserveUrl,
        walletAddress: input.walletAddress,
        publicationStatus: input.publicationStatus,
      },
    });
    const action =
      input.publicationStatus && input.publicationStatus !== existing.publicationStatus
        ? `reserve.${input.publicationStatus === "PUBLISHED" ? "publish" : "unpublish"}`
        : "reserve.update";
    await recordAudit(tx, { adminUserId, action, entityType: "ReserveProfile", entityId: id });
    return updated;
  });
}

export async function deleteReserve(db: PrismaClient, id: string, adminUserId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.reserveProfile.findUnique({ where: { id } });
    if (!existing) throw notFound("Reserve");
    if (existing.publicationStatus === "PUBLISHED") {
      throw conflict("Unpublish the Reserve profile before deleting it", "RESERVE_PUBLISHED");
    }
    await tx.reserveProfile.delete({ where: { id } }); // assets + thesis cascade
    await recordAudit(tx, { adminUserId, action: "reserve.delete", entityType: "ReserveProfile", entityId: id });
  });
}
