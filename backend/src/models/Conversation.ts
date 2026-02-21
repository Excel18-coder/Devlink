import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConversation extends Document {
  participantA: Types.ObjectId;
  participantB: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participantA: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participantB: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

conversationSchema.index({ participantA: 1, participantB: 1 }, { unique: true });

export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
