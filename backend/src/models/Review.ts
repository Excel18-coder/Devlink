import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  contractId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  revieweeId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", reviewSchema);
