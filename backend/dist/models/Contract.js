import mongoose, { Schema } from "mongoose";
const milestoneSchema = new Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: { type: String, default: "pending", enum: ["pending", "submitted", "released", "delivered"] },
    submissionLink: { type: String },
    submissionNote: { type: String },
    finalLink: { type: String },
    finalFileUrl: { type: String }
}, { _id: true });
const developerPaymentDetailsSchema = new Schema({
    method: { type: String, required: true, enum: ["bank_transfer", "mobile_money", "other"] },
    accountName: { type: String, default: "" },
    details: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });
const contractSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    developerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "active", enum: ["draft", "active", "completed", "cancelled", "disputed"] },
    totalAmount: { type: Number, default: 0 },
    developerPaymentDetails: { type: developerPaymentDetailsSchema, default: undefined },
    milestones: [milestoneSchema]
}, { timestamps: true });
// Support filtering contracts by party with status + time ordering
contractSchema.index({ employerId: 1, status: 1, createdAt: -1 });
contractSchema.index({ developerId: 1, status: 1, createdAt: -1 });
export const Contract = mongoose.model("Contract", contractSchema);
