import mongoose, { Schema } from "mongoose";
const emailVerificationSchema = new Schema({
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
}, { timestamps: true });
// Auto-delete expired documents after they expire
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema);
