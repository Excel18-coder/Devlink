import mongoose, { Schema, Document, Types } from "mongoose";

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

const escrowTransactionSchema = new Schema<IEscrowTransaction>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    milestoneId: { type: Schema.Types.ObjectId },
    type: { type: String, required: true, enum: ["fund", "release", "refund", "commission"] },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending", enum: ["pending", "completed", "failed"] },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const EscrowTransaction = mongoose.model<IEscrowTransaction>("EscrowTransaction", escrowTransactionSchema);
