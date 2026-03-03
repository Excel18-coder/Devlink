import mongoose, { Schema, Document } from "mongoose";

export type NewsCategory = "jobs" | "platform" | "announcement" | "industry" | "general";
export type NewsStatus   = "draft" | "published";

export interface INewsPost extends Document {
  title:       string;
  slug:        string;
  excerpt:     string;
  body:        string;
  category:    NewsCategory;
  imageUrl?:   string;
  authorId:    mongoose.Types.ObjectId;
  authorName:  string;
  status:      NewsStatus;
  publishedAt?: Date;
  createdAt:   Date;
  updatedAt:   Date;
}

const newsPostSchema = new Schema<INewsPost>(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt:     { type: String, trim: true, maxlength: 500, default: "" },
    body:        { type: String, required: true, maxlength: 50_000 },
    category:    {
      type: String,
      enum: ["jobs", "platform", "announcement", "industry", "general"],
      default: "general",
    },
    imageUrl:    { type: String },
    authorId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName:  { type: String, required: true },
    status:      { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

newsPostSchema.index({ status: 1, publishedAt: -1 });
newsPostSchema.index({ category: 1, status: 1 });
newsPostSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model<INewsPost>("NewsPost", newsPostSchema);
