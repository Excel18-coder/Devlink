import mongoose, { Schema } from "mongoose";
const developerSchema = new Schema({
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
}, { timestamps: true });
// Indexes for the developer listing filter and default sort
developerSchema.index({ skills: 1 });
developerSchema.index({ availability: 1 });
developerSchema.index({ ratingAvg: -1, yearsExperience: -1 });
export const Developer = mongoose.model("Developer", developerSchema);
