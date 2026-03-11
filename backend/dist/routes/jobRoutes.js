import { Router } from "express";
import { Job } from "../models/Job.js";
import { Employer } from "../models/Employer.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { createJobSchema, updateJobSchema } from "../schemas/jobSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { validateObjectIds } from "../middleware/validateObjectIds.js";
const router = Router();
router.use(validateObjectIds);
const VALID_JOB_STATUSES = ["open", "paused", "closed"];
// ─── Public: list open jobs ──────────────────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
    const { skill, experience, jobType, budgetMin, budgetMax, search, page = "1", limit = "12" } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 50);
    const offset = (Math.max(1, Number(page)) - 1) * safeLimit;
    const filter = { status: "open" };
    if (skill)
        filter.requiredSkills = String(skill);
    if (experience)
        filter.experienceLevel = String(experience);
    if (jobType)
        filter.jobType = String(jobType);
    if (budgetMin || budgetMax) {
        const budgetFilter = {};
        if (budgetMin)
            budgetFilter.$gte = Number(budgetMin);
        if (budgetMax)
            budgetFilter.$lte = Number(budgetMax);
        filter.budgetMin = budgetFilter;
    }
    if (search) {
        const re = new RegExp(escapeRegex(String(search)), "i");
        filter.$or = [{ title: re }, { description: re }];
    }
    const [jobs, total] = await Promise.all([
        Job.find(filter).sort({ createdAt: -1 }).skip(offset).limit(safeLimit).lean(),
        Job.countDocuments(filter),
    ]);
    const employerIds = [...new Set(jobs.map((j) => j.employerId.toString()))];
    const employers = await Employer.find({ userId: { $in: employerIds } }).select("userId companyName").lean();
    const empMap = new Map(employers.map((e) => [e.userId.toString(), e.companyName]));
    return res.json({
        jobs: jobs.map((j) => ({
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
            createdAt: j.createdAt,
        })),
        total,
        page: Number(page),
        pages: Math.ceil(total / safeLimit),
    });
}));
// ─── Public: jobs by employer ────────────────────────────────────────────────
router.get("/employer/:employerId", asyncHandler(async (req, res) => {
    const jobs = await Job.find({ employerId: req.params.employerId }).sort({ createdAt: -1 }).lean();
    return res.json(jobs.map((j) => ({ id: j._id.toString(), title: j.title, status: j.status, createdAt: j.createdAt })));
}));
// ─── Public: single job ──────────────────────────────────────────────────────
router.get("/:id", asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id).lean();
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    const emp = await Employer.findOne({ userId: job.employerId }).select("companyName").lean();
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
        createdAt: job.createdAt,
    });
}));
// ─── Create job ──────────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole("employer"), validate(createJobSchema), asyncHandler(async (req, res) => {
    const { title, description, requiredSkills, experienceLevel, budgetMin, budgetMax, rateType, jobType, location } = req.body;
    const job = await Job.create({
        employerId: req.user.id,
        title,
        description,
        requiredSkills: requiredSkills ?? [],
        experienceLevel,
        budgetMin,
        budgetMax,
        rateType,
        jobType,
        location,
    });
    return res.status(201).json({ id: job._id.toString() });
}));
// ─── Update job ──────────────────────────────────────────────────────────────
router.patch("/:id", requireAuth, requireRole("employer"), validate(updateJobSchema), asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    if (job.employerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });
    const { title, description, requiredSkills, experienceLevel, budgetMin, budgetMax, rateType, jobType, location } = req.body;
    const updates = {};
    if (title !== undefined)
        updates.title = title;
    if (description !== undefined)
        updates.description = description;
    if (requiredSkills !== undefined)
        updates.requiredSkills = requiredSkills;
    if (experienceLevel !== undefined)
        updates.experienceLevel = experienceLevel;
    if (budgetMin !== undefined)
        updates.budgetMin = budgetMin;
    if (budgetMax !== undefined)
        updates.budgetMax = budgetMax;
    if (rateType !== undefined)
        updates.rateType = rateType;
    if (jobType !== undefined)
        updates.jobType = jobType;
    if (location !== undefined)
        updates.location = location;
    await Job.findByIdAndUpdate(req.params.id, updates);
    return res.json({ message: "Job updated" });
}));
// ─── Close job ───────────────────────────────────────────────────────────────
router.post("/:id/close", requireAuth, requireRole("employer"), asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    if (job.employerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });
    await Job.findByIdAndUpdate(req.params.id, { status: "closed" });
    return res.json({ message: "Job closed" });
}));
// ─── Update job status ───────────────────────────────────────────────────────
router.patch("/:id/status", requireAuth, requireRole("employer", "admin"), asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!VALID_JOB_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    const job = await Job.findById(req.params.id);
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    if (req.user.role === "employer" && job.employerId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await Job.findByIdAndUpdate(req.params.id, { status });
    return res.json({ message: "Job status updated" });
}));
// ─── Delete job ──────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireRole("employer", "admin"), asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    if (req.user.role === "employer" && job.employerId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await Job.findByIdAndDelete(req.params.id);
    return res.json({ message: "Job deleted" });
}));
export default router;
