import mongoose, { Schema } from "mongoose";
const employerSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true },
    website: { type: String },
    about: { type: String },
    location: { type: String },
    avatarUrl: { type: String }
}, { timestamps: true });
export const Employer = mongoose.model("Employer", employerSchema);
