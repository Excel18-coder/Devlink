import mongoose, { Document } from "mongoose";
export type NewsCategory = "jobs" | "platform" | "announcement" | "industry" | "general";
export type NewsStatus = "draft" | "published";
export interface INewsPost extends Document {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    category: NewsCategory;
    imageUrl?: string;
    imagePublicId?: string;
    authorId: mongoose.Types.ObjectId;
    authorName: string;
    status: NewsStatus;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INewsPost, {}, {}, {}, mongoose.Document<unknown, {}, INewsPost, {}, mongoose.DefaultSchemaOptions> & INewsPost & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INewsPost>;
export default _default;
