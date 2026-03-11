import { Router } from "express";
import { Developer } from "../models/Developer.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { updateDeveloperSchema } from "../schemas/developerSchemas.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { validateObjectIds } from "../middleware/validateObjectIds.js";
const router = Router();
router.use(validateObjectIds);
const PAGE_SIZE = 20;
// ─── Public: list developers with filters ────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
    const { skill, availability, rateMin, rateMax, experience, search, page = "1" } = req.query;
    const pageNum = Math.max(1, Math.min(Number(page), 1000));
    const skip = (pageNum - 1) * PAGE_SIZE;
    // Always restrict to active developer accounts so suspended users never appear
    const activeUsers = await User.find({ role: "developer", status: "active" }).select("_id fullName email").lean();
    const activeUserIds = activeUsers.map((u) => u._id);
    const userMap = new Map(activeUsers.map((u) => [u._id.toString(), u]));
    const devFilter = { userId: { $in: activeUserIds } };
    if (skill)
        devFilter.skills = String(skill);
    if (availability)
        devFilter.availability = String(availability);
    if (rateMin || rateMax) {
        const rateFilter = {};
        if (rateMin)
            rateFilter.$gte = Number(rateMin);
        if (rateMax)
            rateFilter.$lte = Number(rateMax);
        devFilter.rateAmount = rateFilter;
    }
    if (experience)
        devFilter.yearsExperience = { $gte: Number(experience) };
    if (search) {
        const re = new RegExp(escapeRegex(String(search)), "i");
        // Match active developers whose name matches OR whose skills match.
        // The base userId constraint keeps inactive accounts out of both branches.
        const nameMatchIds = activeUsers.filter((u) => re.test(u.fullName ?? "")).map((u) => u._id);
        devFilter.$or = [{ userId: { $in: nameMatchIds } }, { skills: re }];
    }
    // Fetch one extra to determine whether a next page exists
    const developers = await Developer.find(devFilter)
        .sort({ ratingAvg: -1, yearsExperience: -1 })
        .skip(skip)
        .limit(PAGE_SIZE + 1)
        .lean();
    const hasMore = developers.length > PAGE_SIZE;
    const pageData = hasMore ? developers.slice(0, PAGE_SIZE) : developers;
    const mapped = pageData
        .map((d) => {
        const u = userMap.get(d.userId.toString());
        if (!u)
            return null;
        return {
            id: d.userId.toString(),
            fullName: u.fullName,
            email: u.email,
            bio: d.bio,
            skills: d.skills,
            yearsExperience: d.yearsExperience,
            portfolioLinks: d.portfolioLinks,
            githubUrl: d.githubUrl,
            resumeUrl: d.resumeUrl,
            avatarUrl: d.avatarUrl,
            availability: d.availability,
            rateType: d.rateType,
            rateAmount: d.rateAmount,
            ratingAvg: d.ratingAvg,
            location: d.location,
        };
    })
        .filter(Boolean);
    return res.json({ developers: mapped, hasMore });
}));
// ─── Public: single developer profile ────────────────────────────────────────
router.get("/:id", asyncHandler(async (req, res) => {
    const [dev, user] = await Promise.all([
        Developer.findOne({ userId: req.params.id }).lean(),
        User.findById(req.params.id).select("fullName email").lean(),
    ]);
    if (!dev || !user)
        return res.status(404).json({ message: "Developer not found" });
    return res.json({
        id: dev.userId.toString(),
        fullName: user.fullName,
        email: user.email,
        bio: dev.bio,
        skills: dev.skills,
        yearsExperience: dev.yearsExperience,
        portfolioLinks: dev.portfolioLinks,
        githubUrl: dev.githubUrl,
        resumeUrl: dev.resumeUrl,
        avatarUrl: dev.avatarUrl,
        availability: dev.availability,
        rateType: dev.rateType,
        rateAmount: dev.rateAmount,
        ratingAvg: dev.ratingAvg,
        location: dev.location,
    });
}));
// ─── Update own developer profile ────────────────────────────────────────────
router.patch("/me", requireAuth, requireRole("developer"), validate(updateDeveloperSchema), asyncHandler(async (req, res) => {
    const { bio, skills, yearsExperience, portfolioLinks, githubUrl, availability, rateType, rateAmount, location } = req.body;
    const updates = {};
    if (bio !== undefined)
        updates.bio = bio;
    if (skills !== undefined)
        updates.skills = skills;
    if (yearsExperience !== undefined)
        updates.yearsExperience = yearsExperience;
    if (portfolioLinks !== undefined)
        updates.portfolioLinks = portfolioLinks;
    if (githubUrl !== undefined)
        updates.githubUrl = githubUrl;
    if (availability !== undefined)
        updates.availability = availability;
    if (rateType !== undefined)
        updates.rateType = rateType;
    if (rateAmount !== undefined)
        updates.rateAmount = rateAmount;
    if (location !== undefined)
        updates.location = location;
    await Developer.findOneAndUpdate({ userId: req.user.id }, updates);
    return res.json({ message: "Profile updated" });
}));
// ─── Upload resume ────────────────────────────────────────────────────────────
router.post("/me/resume", requireAuth, requireRole("developer"), upload.single("resume"), asyncHandler(async (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: "No file provided" });
    const result = await uploadToCloudinary(req.file.buffer, { folder: "devlink/resumes", resource_type: "raw" });
    await Developer.findOneAndUpdate({ userId: req.user.id }, { resumeUrl: result.secureUrl });
    return res.json({ resumeUrl: result.secureUrl });
}));
// ─── Upload avatar ────────────────────────────────────────────────────────────
router.post("/me/avatar", requireAuth, requireRole("developer"), upload.single("avatar"), asyncHandler(async (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: "No file provided" });
    const result = await uploadToCloudinary(req.file.buffer, { folder: "devlink/avatars", resource_type: "image" });
    await Developer.findOneAndUpdate({ userId: req.user.id }, { avatarUrl: result.secureUrl });
    return res.json({ avatarUrl: result.secureUrl });
}));
export default router;
