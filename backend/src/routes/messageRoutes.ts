import { Router, Response } from "express";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendMessageSchema } from "../schemas/messageSchemas.js";
import mongoose from "mongoose";

const router = Router();

router.get("/conversations", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const conversations = await Conversation.find({
    $or: [{ participantA: userId }, { participantB: userId }]
  }).sort({ createdAt: -1 });

  const participantIds = conversations.flatMap((c) => [c.participantA.toString(), c.participantB.toString()]);
  const uniqueIds = [...new Set(participantIds)];
  const users = await User.find({ _id: { $in: uniqueIds } }).select("_id fullName");
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));

  return res.json(
    conversations.map((c) => {
      const isA = c.participantA.toString() === userId;
      const otherId = isA ? c.participantB.toString() : c.participantA.toString();
      return {
        id: c._id.toString(),
        otherUserId: otherId,
        otherUserName: userMap.get(otherId)
      };
    })
  );
});

router.get("/conversations/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const conv = await Conversation.findById(req.params.id);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  if (conv.participantA.toString() !== userId && conv.participantB.toString() !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
  const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
  const users = await User.find({ _id: { $in: senderIds } }).select("_id fullName");
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));

  return res.json(
    messages.map((m) => ({
      id: m._id.toString(),
      senderId: m.senderId.toString(),
      senderName: userMap.get(m.senderId.toString()),
      body: m.body,
      createdAt: m.createdAt
    }))
  );
});

router.post("/", requireAuth, validate(sendMessageSchema), async (req: AuthRequest, res: Response) => {
  const { recipientId, body } = req.body;
  const senderId = req.user!.id;

  const ids = [senderId, recipientId].sort();
  const [idA, idB] = ids.map((id) => new mongoose.Types.ObjectId(id));

  let conv = await Conversation.findOne({ participantA: idA, participantB: idB });
  if (!conv) {
    conv = await Conversation.create({ participantA: idA, participantB: idB });
  }

  const message = await Message.create({ conversationId: conv._id, senderId, recipientId, body });
  return res.status(201).json({ id: message._id.toString(), conversationId: conv._id.toString() });
});

export default router;
