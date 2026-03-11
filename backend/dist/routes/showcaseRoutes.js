import { Router } from "express";
import { Showcase } from "../models/Showcase.js";
import { Developer } from "../models/Developer.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { createShowcaseSchema, updateShowcaseSchema } from "../schemas/showcaseSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { validateObjectIds } from "../middleware/validateObjectIds.js";
const router = Router();
router.use(validateObjectIds);
// ─── Public: list active showcases ────────────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
    const { category, lookingFor, tech, search, page = "1", limit = "12" } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 50);
    const offset = (Math.max(1, Number(page)) - 1) * safeLimit;
    const filter = { status: "active" };
    if (category)
        filter.category = String(category);
    if (lookingFor)
        filter.lookingFor = { $in: [String(lookingFor), "both"] };
    if (tech)
        filter.techStack = new RegExp(escapeRegex(String(tech)), "i");
    if (search) {
        filter.$or = [
            { title: new RegExp(escapeRegex(String(search)), "i") },
            { tagline: new RegExp(escapeRegex(String(search)), "i") },
            { techStack: new RegExp(escapeRegex(String(search)), "i") },
        ];
    }
    const [showcases, total] = await Promise.all([
        Showcase.find(filter).sort({ createdAt: -1 }).skip(offset).limit(safeLimit).lean(),
        Showcase.countDocuments(filter),
    ]);
    const devIds = showcases.map((s) => s.developerId.toString());
    const [developers, users] = await Promise.all([
        Developer.find({ userId: { $in: devIds } }).select("userId avatarUrl ratingAvg").lean(),
        User.find({ _id: { $in: devIds } }).select("fullName").lean(),
    ]);
    const devMap = new Map(developers.map((d) => [d.userId.toString(), d]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const result = showcases.map((s) => {
        const dev = devMap.get(s.developerId.toString());
        const user = userMap.get(s.developerId.toString());
        return {
            id: s._id.toString(),
            developerId: s.developerId.toString(),
            developerName: user?.fullName ?? "Unknown",
            developerAvatar: dev?.avatarUrl ?? null,
            developerRating: dev?.ratingAvg ?? 0,
            title: s.title,
            tagline: s.tagline,
            description: s.description,
            techStack: s.techStack,
            projectUrl: s.projectUrl,
            repoUrl: s.repoUrl,
            imageUrl: s.imageUrl,
            category: s.category,
            lookingFor: s.lookingFor,
            likes: s.likedBy.length,
            createdAt: s.createdAt,
        };
    });
    return res.json({ showcases: result, total, page: Number(page), pages: Math.ceil(total / safeLimit) });
}));
// ─── Auth: developer's own showcases ──────────────────────────────────────────
router.get("/me", requireAuth, requireRole("developer"), asyncHandler(async (req, res) => {
    const showcases = await Showcase.find({ developerId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(showcases.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        tagline: s.tagline,
        description: s.description,
        techStack: s.techStack,
        projectUrl: s.projectUrl,
        repoUrl: s.repoUrl,
        imageUrl: s.imageUrl,
        category: s.category,
        lookingFor: s.lookingFor,
        status: s.status,
        likes: s.likedBy.length,
        createdAt: s.createdAt,
    })));
}));
// ─── Public: single showcase ───────────────────────────────────────────────────
router.get("/:id", asyncHandler(async (req, res) => {
    const showcase = await Showcase.findById(req.params.id).lean();
    if (!showcase)
        return res.status(404).json({ message: "Showcase not found" });
    const [dev, user] = await Promise.all([
        Developer.findOne({ userId: showcase.developerId }).select("avatarUrl ratingAvg skills yearsExperience availability").lean(),
        User.findById(showcase.developerId).select("fullName").lean(),
    ]);
    return res.json({
        id: showcase._id.toString(),
        developerId: showcase.developerId.toString(),
        developerName: user?.fullName ?? "Unknown",
        developerAvatar: dev?.avatarUrl ?? null,
        developerRating: dev?.ratingAvg ?? 0,
        developerSkills: dev?.skills ?? [],
        developerExperience: dev?.yearsExperience ?? 0,
        developerAvailability: dev?.availability ?? "contract",
        title: showcase.title,
        tagline: showcase.tagline,
        description: showcase.description,
        techStack: showcase.techStack,
        projectUrl: showcase.projectUrl,
        repoUrl: showcase.repoUrl,
        imageUrl: showcase.imageUrl,
        category: showcase.category,
        lookingFor: showcase.lookingFor,
        status: showcase.status,
        likes: showcase.likedBy.length,
        likedBy: showcase.likedBy.map(String),
        createdAt: showcase.createdAt,
    });
}));
// ─── Create showcase ───────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole("developer"), validate(createShowcaseSchema), asyncHandler(async (req, res) => {
    const { title, tagline, description, techStack, projectUrl, repoUrl, category, lookingFor, status } = req.body;
    const showcase = await Showcase.create({
        developerId: req.user.id,
        title,
        tagline,
        description,
        techStack,
        projectUrl: projectUrl || undefined,
        repoUrl: repoUrl || undefined,
        category,
        lookingFor,
        status,
    });
    return res.status(201).json({ id: showcase._id.toString(), message: "Showcase created" });
}));
// ─── Update showcase ───────────────────────────────────────────────────────────
router.patch("/:id", requireAuth, requireRole("developer"), validate(updateShowcaseSchema), asyncHandler(async (req, res) => {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase)
        return res.status(404).json({ message: "Showcase not found" });
    if (showcase.developerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });
    const allowed = ["title", "tagline", "description", "techStack", "projectUrl", "repoUrl", "category", "lookingFor", "status"];
    allowed.forEach((key) => {
        if (req.body[key] !== undefined)
            showcase[key] = req.body[key];
    });
    await showcase.save();
    return res.json({ message: "Showcase updated" });
}));
// ─── Delete showcase ───────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireRole("developer"), asyncHandler(async (req, res) => {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase)
        return res.status(404).json({ message: "Showcase not found" });
    if (showcase.developerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });
    await showcase.deleteOne();
    return res.json({ message: "Showcase deleted" });
}));
// ─── Like / unlike ────────────────────────────────────────────────────────────
router.post("/:id/like", requireAuth, asyncHandler(async (req, res) => {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase)
        return res.status(404).json({ message: "Showcase not found" });
    const userId = req.user.id;
    const alreadyLiked = showcase.likedBy.some((id) => id.toString() === userId);
    if (alreadyLiked) {
        showcase.likedBy = showcase.likedBy.filter((id) => id.toString() !== userId);
    }
    else {
        showcase.likedBy.push(userId);
    }
    await showcase.save();
    return res.json({ likes: showcase.likedBy.length, liked: !alreadyLiked });
}));
// ─── Upload showcase image ────────────────────────────────────────────────────
router.post("/:id/image", requireAuth, requireRole("developer"), upload.single("image"), asyncHandler(async (req, res) => {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase)
        return res.status(404).json({ message: "Showcase not found" });
    if (showcase.developerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });
    if (!req.file)
        return res.status(400).json({ message: "No file provided" });
    const result = await uploadToCloudinary(req.file.buffer, { folder: "devlink/showcases", resource_type: "image" });
    showcase.imageUrl = result.secureUrl;
    await showcase.save();
    return res.json({ imageUrl: result.secureUrl });
}));
export default router;
