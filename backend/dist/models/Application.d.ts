import mongoose, { Document, Types } from "mongoose";
export interface IApplication extends Document {
    jobId: Types.ObjectId;
    developerId: Types.ObjectId;
    coverLetter?: string;
    status: "submitted" | "shortlisted" | "rejected" | "accepted";
    createdAt: Date;
    updatedAt: Date;
}
export declare const Application: mongoose.Model<IApplication, {}, {}, {}, mongoose.Document<unknown, {}, IApplication, {}, mongoose.DefaultSchemaOptions> & IApplication & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IApplication>;
