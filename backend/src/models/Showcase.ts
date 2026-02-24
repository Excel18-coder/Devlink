import mongoose, { Schema, Document, Types } from "mongoose";

export interface IShowcase extends Document {
  developerId: Types.ObjectId;
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  projectUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  category: "fintech" | "agritech" | "medtech" | "biotech" | "ecommerce" | "climatetech" | "engineering" | "edtech" | "proptech" | "logistics" | "ai" | "web" | "mobile" | "other";
  lookingFor: "employers" | "investors" | "both";
  status: "active" | "draft";
  likedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const showcaseSchema = new Schema<IShowcase>(
  {
    developerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    techStack: [{ type: String }],
    projectUrl: { type: String },
    repoUrl: { type: String },
    imageUrl: { type: String },
    category: {
      type: String,
      enum: ["fintech", "agritech", "medtech", "biotech", "ecommerce", "climatetech", "engineering", "edtech", "proptech", "logistics", "ai", "web", "mobile", "other"],
      default: "web"
    },
    lookingFor: {
      type: String,
      enum: ["employers", "investors", "both"],
      default: "both"
    },
    status: { type: String, enum: ["active", "draft"], default: "active" },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

showcaseSchema.index({ developerId: 1 });
showcaseSchema.index({ category: 1, status: 1 });
showcaseSchema.index({ lookingFor: 1, status: 1 });

export const Showcase = mongoose.model<IShowcase>("Showcase", showcaseSchema);
