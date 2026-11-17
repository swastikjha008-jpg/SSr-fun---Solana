import type { Db } from "@/lib/db";

export interface AuditEntry {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
}

/** Records WHO did WHAT to WHICH entity. Deliberately stores no request payloads or personal data. */
export async function recordAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      adminUserId: entry.adminUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
    },
  });
}
