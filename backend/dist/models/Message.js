import mongoose, { Schema } from "mongoose";
const messageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true }
}, { timestamps: true });
// Essential: every message fetch queries by conversationId and sorts by createdAt
messageSchema.index({ conversationId: 1, createdAt: 1 });
export const Message = mongoose.model("Message", messageSchema);
