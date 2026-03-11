import mongoose, { Schema } from "mongoose";
const applicationSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    developerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coverLetter: { type: String },
    status: { type: String, default: "submitted", enum: ["submitted", "shortlisted", "rejected", "accepted"] }
}, { timestamps: true });
applicationSchema.index({ jobId: 1, developerId: 1 }, { unique: true });
// Support sorted look-ups without a full scan
applicationSchema.index({ developerId: 1, createdAt: -1 });
applicationSchema.index({ jobId: 1, createdAt: -1 });
export const Application = mongoose.model("Application", applicationSchema);
