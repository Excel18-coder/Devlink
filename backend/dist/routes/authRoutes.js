import { Router } from "express";
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
import { requireAuth } from "../middleware/auth.js";
import { sendVerificationEmail } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";
const router = Router();
/** Lifetime for stored refresh tokens — must stay in sync with JWT_REFRESH_TTL. */
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
// Bcrypt cost we want all new hashes to use. If an existing hash was created
// with a lower factor we re-hash it transparently on next successful login.
const BCRYPT_ROUNDS = 12;
// ─── Step 1: Send OTP ────────────────────────────────────────────────────────
router.post("/send-otp", validate(sendOtpSchema), asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await User.findOne({ email }).select("_id").lean();
    // Constant-time response — don't reveal whether the email is registered
    if (existing) {
        return res.json({ message: "Verification code sent to your email" });
    }
    // Delete any previous OTPs for this email
    await EmailVerification.deleteMany({ email });
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await EmailVerification.create({ email, otp, expiresAt, verified: false });
    try {
        await sendVerificationEmail(email, otp);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to send verification email:", err);
        await EmailVerification.deleteOne({ email });
        return res.status(500).json({ message: "We couldn't send the verification code. Please try again in a moment." });
    }
    return res.json({ message: "Verification code sent to your email" });
}));
// ─── Step 2: Verify OTP ───────────────────────────────────────────────────────
router.post("/verify-otp", validate(verifyOtpSchema), asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const { otp } = req.body;
    const record = await EmailVerification.findOne({ email, verified: false });
    if (!record)
        return res.status(400).json({ message: "No verification request found. Please go back and request a new code." });
    if (record.expiresAt < new Date()) {
        await EmailVerification.deleteOne({ _id: record._id });
        return res.status(400).json({ message: "Verification code expired. Please request a new one." });
    }
    if (record.otp !== otp)
        return res.status(400).json({ message: "Incorrect verification code" });
    record.verified = true;
    await record.save();
    return res.json({ message: "Email verified successfully" });
}));
// ─── Step 3: Register ─────────────────────────────────────────────────────────
router.post("/register", validate(registerSchema), asyncHandler(async (req, res) => {
    const { email, password, role, fullName } = req.body;
    const normalizedEmail = email.toLowerCase();
    // Ensure email was verified via OTP
    const verification = await EmailVerification.findOne({ email: normalizedEmail, verified: true });
    if (!verification) {
        return res.status(403).json({ message: "Please verify your email before creating an account." });
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
        return res.status(400).json({ message: "Email already in use" });
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ email: normalizedEmail, passwordHash: hash, role, fullName: fullName ?? undefined });
    const userId = user._id.toString();
    if (role === "developer") {
        await Developer.create({ userId: user._id });
    }
    else if (role === "employer") {
        await Employer.create({ userId: user._id, companyName: fullName ?? "Company" });
    }
    // Clean up the verification record
    await EmailVerification.deleteOne({ _id: verification._id });
    const accessToken = signAccessToken({ id: userId, role });
    const refreshToken = signRefreshToken({ id: userId });
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) });
    await createAuditLog({ action: "register", entity: "user", entityId: userId, metadata: { email: normalizedEmail, role } });
    return res.status(201).json({
        accessToken,
        refreshToken,
        userId,
        role,
        email: user.email,
        fullName: user.fullName ?? "",
        status: user.status,
    });
}));
// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always run bcrypt even on miss — prevents timing-based user enumeration
    const dummyHash = "$2b$12$invalidhashpaddingtomatchbcryptlength000000000000000000";
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, dummyHash).then(() => false);
    if (!user || !valid)
        return res.status(401).json({ message: "Invalid credentials" });
    if (user.status !== "active")
        return res.status(403).json({ message: "Account suspended" });
    const userId = user._id.toString();
    // Transparently upgrade hash cost if it was stored with an older/lower factor
    const currentRounds = bcrypt.getRounds(user.passwordHash);
    if (currentRounds < BCRYPT_ROUNDS) {
        const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await User.findByIdAndUpdate(userId, { passwordHash: newHash });
    }
    const accessToken = signAccessToken({ id: userId, role: user.role });
    const refreshToken = signRefreshToken({ id: userId });
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) });
    await createAuditLog({ action: "login", entity: "user", entityId: userId, metadata: { email: user.email } });
    return res.json({
        accessToken,
        refreshToken,
        userId,
        role: user.role,
        email: user.email,
        fullName: user.fullName ?? "",
        status: user.status,
    });
}));
// ─── Refresh token ────────────────────────────────────────────────────────────
router.post("/refresh", asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ message: "Missing refresh token" });
    try {
        const decoded = verifyRefreshToken(refreshToken);
        // Atomic delete — if the token doesn't exist (reuse attack) this fails fast
        const stored = await RefreshToken.findOneAndDelete({ token: refreshToken, expiresAt: { $gt: new Date() } });
        if (!stored)
            return res.status(401).json({ message: "Invalid refresh token" });
        const user = await User.findById(decoded.id).select("role status");
        if (!user)
            return res.status(401).json({ message: "User not found" });
        if (user.status !== "active")
            return res.status(403).json({ message: "Account suspended" });
        // Issue a fresh access token AND a rotated refresh token
        const newAccess = signAccessToken({ id: decoded.id, role: user.role });
        const newRefresh = signRefreshToken({ id: decoded.id });
        await RefreshToken.create({ userId: decoded.id, token: newRefresh, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) });
        return res.json({ accessToken: newAccess, refreshToken: newRefresh });
    }
    catch {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
}));
// ─── Logout ────────────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken)
        await RefreshToken.deleteOne({ token: refreshToken });
    await createAuditLog({ actorId: req.user.id, action: "logout", entity: "user", entityId: req.user.id });
    return res.json({ message: "Logged out" });
}));
// ─── Current user ───────────────────────────────────────────────────────────────
router.get("/me", requireAuth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("email role fullName status");
    if (!user)
        return res.status(404).json({ message: "User not found" });
    return res.json({ id: user._id.toString(), email: user.email, role: user.role, fullName: user.fullName, status: user.status });
}));
export default router;
