import mongoose, { Document, Types } from "mongoose";
export interface IEscrowTransaction extends Document {
    contractId: Types.ObjectId;
    milestoneId?: Types.ObjectId;
    type: "fund" | "release" | "refund" | "commission";
    amount: number;
    status: "pending" | "completed" | "failed";
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const EscrowTransaction: mongoose.Model<IEscrowTransaction, {}, {}, {}, mongoose.Document<unknown, {}, IEscrowTransaction, {}, mongoose.DefaultSchemaOptions> & IEscrowTransaction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEscrowTransaction>;
