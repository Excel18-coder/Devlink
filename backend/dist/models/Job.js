import mongoose, { Schema } from "mongoose";
const jobSchema = new Schema({
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    experienceLevel: { type: String, default: "mid", enum: ["junior", "mid", "senior"] },
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    rateType: { type: String, default: "project", enum: ["hourly", "monthly", "project"] },
    jobType: { type: String, default: "remote", enum: ["remote", "onsite", "contract"] },
    location: { type: String },
    status: { type: String, default: "open", enum: ["open", "closed", "paused"] }
}, { timestamps: true });
// Indexes for common listing and filter patterns
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ employerId: 1, createdAt: -1 });
jobSchema.index({ status: 1, requiredSkills: 1 });
jobSchema.index({ status: 1, experienceLevel: 1 });
jobSchema.index({ status: 1, jobType: 1 });
export const Job = mongoose.model("Job", jobSchema);
