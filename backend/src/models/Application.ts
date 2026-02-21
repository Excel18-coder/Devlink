import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  developerId: Types.ObjectId;
  coverLetter?: string;
  status: "submitted" | "shortlisted" | "rejected" | "accepted";
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    developerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coverLetter: { type: String },
    status: { type: String, default: "submitted", enum: ["submitted", "shortlisted", "rejected", "accepted"] }
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, developerId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>("Application", applicationSchema);
