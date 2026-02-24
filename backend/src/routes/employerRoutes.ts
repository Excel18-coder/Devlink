import { Router, Response } from "express";
import { Employer } from "../models/Employer.js";
import { User } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { updateEmployerSchema } from "../schemas/employerSchemas.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const router = Router();

router.get("/", async (_req, res) => {
  const employers = await Employer.find().populate<{ userId: { _id: { toString(): string }; fullName?: string; email: string; status: string } }>("userId", "fullName email status");
  const active = employers.filter((e) => e.userId?.status === "active");
  return res.json(
    active.map((e) => ({
      id: e.userId._id.toString(),
      fullName: e.userId.fullName,
      email: e.userId.email,
      companyName: e.companyName,
      website: e.website,
      about: e.about,
      location: e.location,
      avatarUrl: e.avatarUrl
    }))
  );
});

router.get("/:id", async (req, res) => {
  const emp = await Employer.findOne({ userId: req.params.id });
  if (!emp) return res.status(404).json({ message: "Employer not found" });
  const user = await User.findById(emp.userId).select("fullName email");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    id: emp.userId.toString(),
    fullName: user.fullName,
    email: user.email,
    companyName: emp.companyName,
    website: emp.website,
    about: emp.about,
    location: emp.location,
    avatarUrl: emp.avatarUrl
  });
});

router.patch("/me", requireAuth, requireRole("employer"), validate(updateEmployerSchema), async (req: AuthRequest, res: Response) => {
  const { companyName, website, about, location } = req.body;
  const updates: Record<string, unknown> = {};
  if (companyName !== undefined) updates.companyName = companyName;
  if (website !== undefined) updates.website = website;
  if (about !== undefined) updates.about = about;
  if (location !== undefined) updates.location = location;
  await Employer.findOneAndUpdate({ userId: req.user!.id }, updates);
  return res.json({ message: "Profile updated" });
});

router.post("/me/avatar", requireAuth, requireRole("employer"), upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file provided" });
  const result = await uploadToCloudinary(req.file.buffer, { folder: "devlink/avatars", resource_type: "image" });
  await Employer.findOneAndUpdate({ userId: req.user!.id }, { avatarUrl: result.secureUrl });
  return res.json({ avatarUrl: result.secureUrl });
});

export default router;
