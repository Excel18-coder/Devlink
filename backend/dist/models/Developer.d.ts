import mongoose, { Document, Types } from "mongoose";
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
export declare const Developer: mongoose.Model<IDeveloper, {}, {}, {}, mongoose.Document<unknown, {}, IDeveloper, {}, mongoose.DefaultSchemaOptions> & IDeveloper & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IDeveloper>;
