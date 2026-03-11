import mongoose, { Document, Types } from "mongoose";
export interface IReview extends Document {
    contractId: Types.ObjectId;
    reviewerId: Types.ObjectId;
    revieweeId: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, mongoose.DefaultSchemaOptions> & IReview & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IReview>;
