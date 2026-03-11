import mongoose, { Document } from "mongoose";
export interface IEmailVerification extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    verified: boolean;
    createdAt: Date;
}
export declare const EmailVerification: mongoose.Model<IEmailVerification, {}, {}, {}, mongoose.Document<unknown, {}, IEmailVerification, {}, mongoose.DefaultSchemaOptions> & IEmailVerification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEmailVerification>;
