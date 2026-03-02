import { AuditLog } from "../models/AuditLog.js";

interface LogParams {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export const createAuditLog = async (p: LogParams): Promise<void> => {
  await AuditLog.create({
    actorId: p.actorId,
    action: p.action,
    entity: p.entity,
    entityId: p.entityId,
    metadata: p.metadata ?? {},
  });
};
