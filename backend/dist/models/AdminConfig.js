import mongoose, { Schema } from "mongoose";
const adminConfigSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});
export const AdminConfig = mongoose.model("AdminConfig", adminConfigSchema);
