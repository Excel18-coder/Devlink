import mongoose, { Schema } from "mongoose";
const reviewSchema = new Schema({
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }
}, { timestamps: true });
// Support 'reviews for a user' queries and the rating aggregation pipeline
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ contractId: 1 });
export const Review = mongoose.model("Review", reviewSchema);
