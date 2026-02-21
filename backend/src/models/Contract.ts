import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMilestone {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  dueDate?: Date;
  status: "pending" | "submitted" | "released" | "delivered";
  submissionLink?: string;
  submissionNote?: string;
  finalLink?: string;
  finalFileUrl?: string;
}

export interface IDeveloperPaymentDetails {
  method: "bank_transfer" | "mobile_money" | "other";
  accountName: string;
  details: string;
  updatedAt?: Date;
}

export interface IContract extends Document {
  jobId?: Types.ObjectId;
  employerId: Types.ObjectId;
  developerId: Types.ObjectId;
  status: "draft" | "active" | "completed" | "cancelled" | "disputed";
  totalAmount: number;
  developerPaymentDetails?: IDeveloperPaymentDetails;
  milestones: Types.DocumentArray<IMilestone & Document>;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: { type: String, default: "pending", enum: ["pending", "submitted", "released", "delivered"] },
    submissionLink: { type: String },
    submissionNote: { type: String },
    finalLink: { type: String },
    finalFileUrl: { type: String }
  },
  { _id: true }
);

const developerPaymentDetailsSchema = new Schema(
  {
    method: { type: String, required: true, enum: ["bank_transfer", "mobile_money", "other"] },
    accountName: { type: String, default: "" },
    details: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const contractSchema = new Schema<IContract>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    developerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "active", enum: ["draft", "active", "completed", "cancelled", "disputed"] },
    totalAmount: { type: Number, default: 0 },
    developerPaymentDetails: { type: developerPaymentDetailsSchema, default: undefined },
    milestones: [milestoneSchema]
  },
  { timestamps: true }
);

export const Contract = mongoose.model<IContract>("Contract", contractSchema);
