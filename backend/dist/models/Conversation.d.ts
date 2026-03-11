import mongoose, { Document, Types } from "mongoose";
export interface IConversation extends Document {
    participantA: Types.ObjectId;
    participantB: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Conversation: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation, {}, mongoose.DefaultSchemaOptions> & IConversation & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IConversation>;
