import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const sendMessageSchema = z.object({
  recipientId: objectId,
  body: z.string().min(1).max(5000)
});
