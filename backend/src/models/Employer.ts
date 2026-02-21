import mongoose, { Schema, Document, Types } from "mongoose";

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

const employerSchema = new Schema<IEmployer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true },
    website: { type: String },
    about: { type: String },
    location: { type: String },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const Employer = mongoose.model<IEmployer>("Employer", employerSchema);
