import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().email().max(254),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().max(254),
  otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(["developer", "employer"]),
  fullName: z.string().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});
