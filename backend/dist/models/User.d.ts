import mongoose, { Document } from "mongoose";
export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: "developer" | "employer" | "admin";
    fullName?: string;
    status: "active" | "suspended" | "pending";
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
