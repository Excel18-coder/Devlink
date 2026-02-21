import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Developer } from "../models/Developer.js";
import { Employer } from "../models/Employer.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password, role, fullName } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash: hash, role, fullName: fullName ?? undefined });
  const userId = user._id.toString();

  if (role === "developer") {
    await Developer.create({ userId: user._id });
  } else if (role === "employer") {
    await Employer.create({ userId: user._id, companyName: fullName ?? "Company" });
  }

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
