import mongoose, { Schema } from "mongoose";
const newsPostSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 500, default: "" },
    body: { type: String, required: true, maxlength: 50_000 },
    category: {
        type: String,
        enum: ["jobs", "platform", "announcement", "industry", "general"],
        default: "general",
    },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
}, { timestamps: true });
newsPostSchema.index({ status: 1, publishedAt: -1 });
newsPostSchema.index({ category: 1, status: 1 });
export default mongoose.model("NewsPost", newsPostSchema);
