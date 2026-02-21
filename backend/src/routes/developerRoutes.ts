import { Router, Response } from "express";
import { Developer } from "../models/Developer.js";
import { User } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { updateDeveloperSchema } from "../schemas/developerSchemas.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const router = Router();

router.get("/", async (req, res) => {
  const { skill, availability, rateMin, rateMax, experience, search, page = "1", limit = "12" } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const userFilter: Record<string, unknown> = { role: "developer", status: "active" };
  if (search) userFilter.fullName = new RegExp(String(search), "i");
  const activeUsers = await User.find(userFilter).select("_id fullName email");
  const activeUserIds = activeUsers.map((u) => u._id);

  const devFilter: Record<string, unknown> = { userId: { $in: activeUserIds } };
  if (skill) devFilter.skills = String(skill);
  if (availability) devFilter.availability = String(availability);
  if (rateMin || rateMax) {
    const rateFilter: Record<string, number> = {};
    if (rateMin) rateFilter.$gte = Number(rateMin);
    if (rateMax) rateFilter.$lte = Number(rateMax);
    devFilter.rateAmount = rateFilter;
  }
  if (experience) devFilter.yearsExperience = { $gte: Number(experience) };
  if (search) {
    devFilter.$or = [{ userId: { $in: activeUserIds } }, { skills: new RegExp(String(search), "i") }];
    delete devFilter.userId;
  }

  const developers = await Developer.find(devFilter).sort({ ratingAvg: -1, yearsExperience: -1 }).skip(offset).limit(Number(limit));
  const userMap = new Map(activeUsers.map((u) => [u._id.toString(), u]));

  const mapped = developers
    .map((d) => {
      const u = userMap.get(d.userId.toString());
      if (!u) return null;
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
        location: d.location
      };
    })
    .filter(Boolean);

  return res.json(mapped);
});

router.get("/:id", async (req, res) => {
  const dev = await Developer.findOne({ userId: req.params.id });
  if (!dev) return res.status(404).json({ message: "Developer not found" });
  const user = await User.findById(dev.userId).select("fullName email");
  if (!user) return res.status(404).json({ message: "User not found" });
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
    location: dev.location
  });
});

router.patch("/me", requireAuth, requireRole("developer"), validate(updateDeveloperSchema), async (req: AuthRequest, res: Response) => {
  const { bio, skills, yearsExperience, portfolioLinks, githubUrl, availability, rateType, rateAmount, location } = req.body;
  const updates: Record<string, unknown> = {};
  if (bio !== undefined) updates.bio = bio;
  if (skills !== undefined) updates.skills = skills;
  if (yearsExperience !== undefined) updates.yearsExperience = yearsExperience;
  if (portfolioLinks !== undefined) updates.portfolioLinks = portfolioLinks;
  if (githubUrl !== undefined) updates.githubUrl = githubUrl;
  if (availability !== undefined) updates.availability = availability;
  if (rateType !== undefined) updates.rateType = rateType;
  if (rateAmount !== undefined) updates.rateAmount = rateAmount;
  if (location !== undefined) updates.location = location;
  await Developer.findOneAndUpdate({ userId: req.user!.id }, updates);
  return res.json({ message: "Profile updated" });
});

router.post("/me/resume", requireAuth, requireRole("developer"), upload.single("resume"), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file provided" });
  const result = await uploadToCloudinary(req.file.buffer, { folder: "afristack/resumes", resource_type: "raw" });
  await Developer.findOneAndUpdate({ userId: req.user!.id }, { resumeUrl: result.secureUrl });
  return res.json({ resumeUrl: result.secureUrl });
});

router.post("/me/avatar", requireAuth, requireRole("developer"), upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file provided" });
  const result = await uploadToCloudinary(req.file.buffer, { folder: "afristack/avatars", resource_type: "image" });
  await Developer.findOneAndUpdate({ userId: req.user!.id }, { avatarUrl: result.secureUrl });
  return res.json({ avatarUrl: result.secureUrl });
});

export default router;
