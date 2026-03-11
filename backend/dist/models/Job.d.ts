import mongoose, { Document, Types } from "mongoose";
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
export declare const Job: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}, mongoose.DefaultSchemaOptions> & IJob & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IJob>;
