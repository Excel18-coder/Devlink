import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: "developer" | "employer" | "admin";
  fullName?: string;
  status: "active" | "suspended" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["developer", "employer", "admin"] },
    fullName: { type: String },
    status: { type: String, default: "active", enum: ["active", "suspended", "pending"] }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
