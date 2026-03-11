import mongoose, { Document, Types } from "mongoose";
export interface IEmployer extends Document {
    userId: Types.ObjectId;
    companyName: string;
    website?: string;
    about?: string;
    location?: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Employer: mongoose.Model<IEmployer, {}, {}, {}, mongoose.Document<unknown, {}, IEmployer, {}, mongoose.DefaultSchemaOptions> & IEmployer & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEmployer>;
