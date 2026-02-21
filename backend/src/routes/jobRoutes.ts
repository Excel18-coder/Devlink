import { Router, Response } from "express";
import { Job } from "../models/Job.js";
import { Employer } from "../models/Employer.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { createJobSchema, updateJobSchema } from "../schemas/jobSchemas.js";

const router = Router();

router.get("/", async (req, res) => {
  const { skill, experience, jobType, budgetMin, budgetMax, search, page = "1", limit = "12" } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = { status: "open" };
  if (skill) filter.requiredSkills = String(skill);
  if (experience) filter.experienceLevel = String(experience);
  if (jobType) filter.jobType = String(jobType);
  if (budgetMin || budgetMax) {
    const budgetFilter: Record<string, number> = {};
    if (budgetMin) budgetFilter.$gte = Number(budgetMin);
    if (budgetMax) budgetFilter.$lte = Number(budgetMax);
    filter.budgetMin = budgetFilter;
  }
  if (search) filter.$or = [{ title: new RegExp(String(search), "i") }, { description: new RegExp(String(search), "i") }];

  const jobs = await Job.find(filter).sort({ createdAt: -1 }).skip(offset).limit(Number(limit));

  const employerIds = [...new Set(jobs.map((j) => j.employerId.toString()))];
  const employers = await Employer.find({ userId: { $in: employerIds } }).select("userId companyName");
  const empMap = new Map(employers.map((e) => [e.userId.toString(), e.companyName]));

  return res.json(
    jobs.map((j) => ({
      id: j._id.toString(),
      employerId: j.employerId.toString(),
      companyName: empMap.get(j.employerId.toString()) ?? "",
      title: j.title,
      description: j.description,
      requiredSkills: j.requiredSkills,
      experienceLevel: j.experienceLevel,
      budgetMin: j.budgetMin,
      budgetMax: j.budgetMax,
      rateType: j.rateType,
      jobType: j.jobType,
      location: j.location,
      status: j.status,
      createdAt: j.createdAt
    }))
  );
});

router.get("/employer/:employerId", async (req, res) => {
  const jobs = await Job.find({ employerId: req.params.employerId }).sort({ createdAt: -1 });
  return res.json(jobs.map((j) => ({ id: j._id.toString(), title: j.title, status: j.status, createdAt: j.createdAt })));
});

router.get("/:id", async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  const emp = await Employer.findOne({ userId: job.employerId }).select("companyName");
  return res.json({
    id: job._id.toString(),
    employerId: job.employerId.toString(),
    companyName: emp?.companyName ?? "",
    title: job.title,
    description: job.description,
    requiredSkills: job.requiredSkills,
    experienceLevel: job.experienceLevel,
    budgetMin: job.budgetMin,
    budgetMax: job.budgetMax,
    rateType: job.rateType,
    jobType: job.jobType,
    location: job.location,
    status: job.status,
    createdAt: job.createdAt
  });
});

router.post("/", requireAuth, requireRole("employer"), validate(createJobSchema), async (req: AuthRequest, res: Response) => {
  const { title, description, requiredSkills, experienceLevel, budgetMin, budgetMax, rateType, jobType, location } = req.body;
  const job = await Job.create({ employerId: req.user!.id, title, description, requiredSkills: requiredSkills ?? [], experienceLevel, budgetMin, budgetMax, rateType, jobType, location });
  return res.status(201).json({ id: job._id.toString() });
});

router.patch("/:id", requireAuth, requireRole("employer"), validate(updateJobSchema), async (req: AuthRequest, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  const { title, description, requiredSkills, experienceLevel, budgetMin, budgetMax, rateType, jobType, location } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (requiredSkills !== undefined) updates.requiredSkills = requiredSkills;
  if (experienceLevel !== undefined) updates.experienceLevel = experienceLevel;
  if (budgetMin !== undefined) updates.budgetMin = budgetMin;
  if (budgetMax !== undefined) updates.budgetMax = budgetMax;
  if (rateType !== undefined) updates.rateType = rateType;
  if (jobType !== undefined) updates.jobType = jobType;
  if (location !== undefined) updates.location = location;
  await Job.findByIdAndUpdate(req.params.id, updates);
  return res.json({ message: "Job updated" });
});

router.post("/:id/close", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  await Job.findByIdAndUpdate(req.params.id, { status: "closed" });
  return res.json({ message: "Job closed" });
});

router.patch("/:id/status", requireAuth, requireRole("employer", "admin"), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!(["open", "paused", "closed"] as string[]).includes(status)) return res.status(400).json({ message: "Invalid status" });
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (req.user!.role === "employer" && job.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  await Job.findByIdAndUpdate(req.params.id, { status });
  return res.json({ message: "Job status updated" });
});

router.delete("/:id", requireAuth, requireRole("employer", "admin"), async (req: AuthRequest, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (req.user!.role === "employer" && job.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  await Job.findByIdAndDelete(req.params.id);
  return res.json({ message: "Job deleted" });
});

export default router;
