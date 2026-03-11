import { Router } from "express";
import { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendMessageSchema } from "../schemas/messageSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectIds } from "../middleware/validateObjectIds.js";
const router = Router();
router.use(validateObjectIds);
// ─── List conversations for the current user ──────────────────────────────────
router.get("/conversations", requireAuth, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const conversations = await Conversation.find({
        $or: [{ participantA: userId }, { participantB: userId }],
    }).sort({ createdAt: -1 }).lean();
    const participantIds = conversations.flatMap((c) => [c.participantA.toString(), c.participantB.toString()]);
    const uniqueIds = [...new Set(participantIds)];
    const users = await User.find({ _id: { $in: uniqueIds } }).select("_id fullName").lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));
    return res.json(conversations.map((c) => {
        const isA = c.participantA.toString() === userId;
        const otherId = isA ? c.participantB.toString() : c.participantA.toString();
        return {
            id: c._id.toString(),
            otherUserId: otherId,
            otherUserName: userMap.get(otherId),
        };
    }));
}));
// ─── Get messages in a conversation ──────────────────────────────────────────
router.get("/conversations/:id", requireAuth, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const conv = await Conversation.findById(req.params.id).lean();
    if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
    if (conv.participantA.toString() !== userId && conv.participantB.toString() !== userId) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 }).lean();
    const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
    const users = await User.find({ _id: { $in: senderIds } }).select("_id fullName").lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));
    return res.json(messages.map((m) => ({
        id: m._id.toString(),
        senderId: m.senderId.toString(),
        senderName: userMap.get(m.senderId.toString()),
        body: m.body,
        createdAt: m.createdAt,
    })));
}));
// ─── Send a message (creates conversation if needed) ─────────────────────────
router.post("/", requireAuth, validate(sendMessageSchema), asyncHandler(async (req, res) => {
    const { recipientId, body } = req.body;
    const senderId = req.user.id;
    const [idA, idB] = [senderId, recipientId].sort().map((id) => new Types.ObjectId(id));
    const existingConv = await Conversation.findOne({ participantA: idA, participantB: idB }).select("_id").lean();
    const convId = existingConv
        ? existingConv._id
        : (await Conversation.create({ participantA: idA, participantB: idB }))._id;
    const message = await Message.create({ conversationId: convId, senderId, recipientId, body });
    return res.status(201).json({ id: message._id.toString(), conversationId: convId.toString() });
}));
export default router;
