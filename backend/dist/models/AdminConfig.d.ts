import mongoose, { Document } from "mongoose";
export interface IAdminConfig extends Document {
    key: string;
    value: string;
}
export declare const AdminConfig: mongoose.Model<IAdminConfig, {}, {}, {}, mongoose.Document<unknown, {}, IAdminConfig, {}, mongoose.DefaultSchemaOptions> & IAdminConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAdminConfig>;
