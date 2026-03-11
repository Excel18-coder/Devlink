import mongoose, { Schema } from "mongoose";
const auditLogSchema = new Schema({
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });
// Admin audit queries: by entity, by actor, and by time
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
