import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { Developer } from "../models/Developer.js";
import { Employer } from "../models/Employer.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { EmailVerification } from "../models/EmailVerification.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { validate } from "../middleware/validate.js";
import { sendOtpSchema, verifyOtpSchema, registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { sendVerificationEmail } from "../services/emailService.js";

const router = Router();

// ─── Step 1: Send OTP ────────────────────────────────────────────────────────
router.post("/send-otp", validate(sendOtpSchema), async (req, res) => {
  const email = (req.body.email as string).toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  // Delete any previous OTPs for this email
  await EmailVerification.deleteMany({ email });

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await EmailVerification.create({ email, otp, expiresAt, verified: false });

  try {
    await sendVerificationEmail(email, otp);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    await EmailVerification.deleteOne({ email });
    return res.status(500).json({ message: "We couldn't send the verification code. Please try again in a moment." });
  }

  return res.json({ message: "Verification code sent to your email" });
});

// ─── Step 2: Verify OTP ───────────────────────────────────────────────────────
router.post("/verify-otp", validate(verifyOtpSchema), async (req, res) => {
  const email = (req.body.email as string).toLowerCase();
  const { otp } = req.body as { otp: string };

  const record = await EmailVerification.findOne({ email, verified: false });
  if (!record) return res.status(400).json({ message: "No verification request found. Please go back and request a new code." });
  if (record.expiresAt < new Date()) {
    await EmailVerification.deleteOne({ _id: record._id });
    return res.status(400).json({ message: "Verification code expired. Please request a new one." });
  }
  if (record.otp !== otp) return res.status(400).json({ message: "Incorrect verification code" });

  record.verified = true;
  await record.save();

  return res.json({ message: "Email verified successfully" });
});

// ─── Step 3: Register ─────────────────────────────────────────────────────────
router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password, role, fullName } = req.body as {
    email: string;
    password: string;
    role: "developer" | "employer";
    fullName?: string;
  };

  const normalizedEmail = email.toLowerCase();

  // Ensure email was verified via OTP
  const verification = await EmailVerification.findOne({ email: normalizedEmail, verified: true });
  if (!verification) {
    return res.status(403).json({ message: "Please verify your email before creating an account." });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: normalizedEmail, passwordHash: hash, role, fullName: fullName ?? undefined });
  const userId = user._id.toString();

  if (role === "developer") {
    await Developer.create({ userId: user._id });
  } else if (role === "employer") {
    await Employer.create({ userId: user._id, companyName: fullName ?? "Company" });
  }

  // Clean up the verification record
  await EmailVerification.deleteOne({ _id: verification._id });

  const accessToken = signAccessToken({ id: userId, role });
  const refreshToken = signRefreshToken({ id: userId });
  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

  return res.status(201).json({ accessToken, refreshToken, userId, role });
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  if (user.status !== "active") return res.status(403).json({ message: "Account suspended" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const userId = user._id.toString();
  const accessToken = signAccessToken({ id: userId, role: user.role });
  const refreshToken = signRefreshToken({ id: userId });
  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

  return res.json({ accessToken, refreshToken, userId, role: user.role });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: "Missing refresh token" });
  try {
    const decoded = verifyRefreshToken(refreshToken) as { id: string };
    const stored = await RefreshToken.findOne({ token: refreshToken, expiresAt: { $gt: new Date() } });
    if (!stored) return res.status(401).json({ message: "Invalid refresh token" });
    const user = await User.findById(decoded.id).select("role");
    if (!user) return res.status(401).json({ message: "User not found" });
    const newAccess = signAccessToken({ id: decoded.id, role: user.role });
    return res.json({ accessToken: newAccess });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", requireAuth, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
  return res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select("email role fullName status");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ id: user._id.toString(), email: user.email, role: user.role, fullName: user.fullName, status: user.status });
});

export default router;
