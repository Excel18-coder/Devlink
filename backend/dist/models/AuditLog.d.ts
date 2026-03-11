import mongoose, { Document, Types } from "mongoose";
export interface IAuditLog extends Document {
    actorId?: Types.ObjectId;
    action: string;
    entity: string;
    entityId?: Types.ObjectId;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, mongoose.DefaultSchemaOptions> & IAuditLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuditLog>;
