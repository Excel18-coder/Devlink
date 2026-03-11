import mongoose, { Document, Types } from "mongoose";
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
export declare const Showcase: mongoose.Model<IShowcase, {}, {}, {}, mongoose.Document<unknown, {}, IShowcase, {}, mongoose.DefaultSchemaOptions> & IShowcase & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IShowcase>;
