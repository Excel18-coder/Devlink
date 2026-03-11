import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["developer", "employer", "admin"] },
    fullName: { type: String },
    status: { type: String, default: "active", enum: ["active", "suspended", "pending"] }
}, { timestamps: true });
// Compound index: used by developer/employer listing queries that filter on both fields
userSchema.index({ role: 1, status: 1 });
export const User = mongoose.model("User", userSchema);
