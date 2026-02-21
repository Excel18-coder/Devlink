import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJob extends Document {
  employerId: Types.ObjectId;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: "junior" | "mid" | "senior";
  budgetMin?: number;
  budgetMax?: number;
  rateType: "hourly" | "monthly" | "project";
  jobType: "remote" | "onsite" | "contract";
  location?: string;
  status: "open" | "closed" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
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
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>("Job", jobSchema);
