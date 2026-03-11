import mongoose, { Document, Types } from "mongoose";
export interface IMilestone {
    _id: Types.ObjectId;
    title: string;
    amount: number;
    dueDate?: Date;
    status: "pending" | "submitted" | "released" | "delivered";
    submissionLink?: string;
    submissionNote?: string;
    finalLink?: string;
    finalFileUrl?: string;
}
export interface IDeveloperPaymentDetails {
    method: "bank_transfer" | "mobile_money" | "other";
    accountName: string;
    details: string;
    updatedAt?: Date;
}
export interface IContract extends Document {
    jobId?: Types.ObjectId;
    employerId: Types.ObjectId;
    developerId: Types.ObjectId;
    status: "draft" | "active" | "completed" | "cancelled" | "disputed";
    totalAmount: number;
    developerPaymentDetails?: IDeveloperPaymentDetails;
    milestones: Types.DocumentArray<IMilestone & Document>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Contract: mongoose.Model<IContract, {}, {}, {}, mongoose.Document<unknown, {}, IContract, {}, mongoose.DefaultSchemaOptions> & IContract & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IContract>;
