import mongoose, { Schema, Document } from "mongoose";

export interface IAdminConfig extends Document {
  key: string;
  value: string;
}

const adminConfigSchema = new Schema<IAdminConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

export const AdminConfig = mongoose.model<IAdminConfig>("AdminConfig", adminConfigSchema);
