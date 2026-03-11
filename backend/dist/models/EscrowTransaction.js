import mongoose, { Schema } from "mongoose";
const escrowTransactionSchema = new Schema({
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    milestoneId: { type: Schema.Types.ObjectId },
    type: { type: String, required: true, enum: ["fund", "release", "refund", "commission"] },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending", enum: ["pending", "completed", "failed"] },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });
export const EscrowTransaction = mongoose.model("EscrowTransaction", escrowTransactionSchema);
