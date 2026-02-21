import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["developer", "employer"]),
  fullName: z.string().min(2).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
