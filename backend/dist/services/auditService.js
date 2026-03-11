import { AuditLog } from "../models/AuditLog.js";
export const createAuditLog = async (p) => {
    await AuditLog.create({
        actorId: p.actorId,
        action: p.action,
        entity: p.entity,
        entityId: p.entityId,
        metadata: p.metadata ?? {},
    });
};
