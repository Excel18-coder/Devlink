import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: Types.ObjectId;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
