import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDeveloper extends Document {
  userId: Types.ObjectId;
  bio?: string;
  skills: string[];
  yearsExperience: number;
  portfolioLinks: string[];
  githubUrl?: string;
  resumeUrl?: string;
  avatarUrl?: string;
  availability: "full-time" | "part-time" | "contract";
  rateType: "hourly" | "monthly" | "project";
  rateAmount: number;
  ratingAvg: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const developerSchema = new Schema<IDeveloper>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    bio: { type: String },
    skills: [{ type: String }],
    yearsExperience: { type: Number, default: 0 },
    portfolioLinks: [{ type: String }],
    githubUrl: { type: String },
    resumeUrl: { type: String },
    avatarUrl: { type: String },
    availability: { type: String, default: "contract", enum: ["full-time", "part-time", "contract"] },
    rateType: { type: String, default: "hourly", enum: ["hourly", "monthly", "project"] },
    rateAmount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    location: { type: String }
  },
  { timestamps: true }
);

export const Developer = mongoose.model<IDeveloper>("Developer", developerSchema);
