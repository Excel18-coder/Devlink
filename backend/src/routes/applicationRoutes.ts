import { Router, Response } from "express";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { Developer } from "../models/Developer.js";
import { User } from "../models/User.js";
import { Employer } from "../models/Employer.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { createApplicationSchema } from "../schemas/applicationSchemas.js";

const router = Router();

router.post("/:jobId", requireAuth, requireRole("developer"), validate(createApplicationSchema), async (req: AuthRequest, res: Response) => {
  const { coverLetter } = req.body;
  const jobId = req.params.jobId;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.status === "closed") return res.status(400).json({ message: "This position has been filled and is no longer accepting applications" });
  if (job.status === "paused") return res.status(400).json({ message: "This job is currently paused and not accepting applications" });

  const existing = await Application.findOne({ jobId, developerId: req.user!.id });
  if (existing) return res.status(400).json({ message: "Already applied" });

  const app = await Application.create({ jobId, developerId: req.user!.id, coverLetter: coverLetter ?? undefined });
  return res.status(201).json({ id: app._id.toString() });
});

router.get("/job/:jobId", requireAuth, requireRole("employer", "admin"), async (req: AuthRequest, res: Response) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (req.user!.role === "employer" && job.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const applications = await Application.find({ jobId: req.params.jobId }).sort({ createdAt: -1 });
  const devIds = applications.map((a) => a.developerId.toString());
  const users = await User.find({ _id: { $in: devIds } }).select("_id fullName");
  const devProfiles = await Developer.find({ userId: { $in: devIds } }).select("userId skills rateAmount yearsExperience");

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const devMap = new Map(devProfiles.map((d) => [d.userId.toString(), d]));

  return res.json(
    applications.map((a) => {
      const u = userMap.get(a.developerId.toString());
      const d = devMap.get(a.developerId.toString());
      return {
        id: a._id.toString(),
        developerId: a.developerId.toString(),
        fullName: u?.fullName,
        skills: d?.skills ?? [],
        yearsExperience: d?.yearsExperience ?? 0,
        rateAmount: d?.rateAmount ?? 0,
        coverLetter: a.coverLetter,
        status: a.status,
        createdAt: a.createdAt
      };
    })
  );
});

router.get("/me", requireAuth, requireRole("developer"), async (req: AuthRequest, res: Response) => {
  const applications = await Application.find({ developerId: req.user!.id }).sort({ createdAt: -1 });
  const jobIds = applications.map((a) => a.jobId.toString());
  const jobs = await Job.find({ _id: { $in: jobIds } }).select("_id title employerId");
  const empIds = jobs.map((j) => j.employerId.toString());
  const employers = await Employer.find({ userId: { $in: empIds } }).select("userId companyName");

  const jobMap = new Map(jobs.map((j) => [j._id.toString(), j]));
  const empMap = new Map(employers.map((e) => [e.userId.toString(), e.companyName]));

  return res.json(
    applications.map((a) => {
      const j = jobMap.get(a.jobId.toString());
      return {
        id: a._id.toString(),
        jobId: a.jobId.toString(),
        jobTitle: j?.title,
        companyName: j ? empMap.get(j.employerId.toString()) : undefined,
        status: a.status,
        createdAt: a.createdAt
      };
    })
  );
});

router.patch("/:id/status", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!(["shortlisted", "rejected", "accepted"] as string[]).includes(status)) return res.status(400).json({ message: "Invalid status" });

  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });

  const job = await Job.findById(app.jobId);
  if (!job || job.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  await Application.findByIdAndUpdate(req.params.id, { status });
  // When a developer is accepted: close the job so no new applications
  // are taken, and reject every other open/shortlisted application
  if (status === "accepted") {
    await Job.findByIdAndUpdate(app.jobId, { status: "closed" });
    await Application.updateMany(
      { jobId: app.jobId, _id: { $ne: app._id }, status: { $in: ["submitted", "shortlisted"] } },
      { status: "rejected" }
    );
  }
  return res.json({ message: "Status updated" });
});

// Developer withdraws their own pending application
router.delete("/:id", requireAuth, requireRole("developer"), async (req: AuthRequest, res: Response) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });
  if (app.developerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  if (app.status !== "submitted") return res.status(400).json({ message: "Can only withdraw a pending application" });
  await Application.findByIdAndDelete(req.params.id);
  return res.json({ message: "Application withdrawn" });
});

// Employer sees recent applicants across all their jobs
router.get("/employer/recent", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const jobs = await Job.find({ employerId: req.user!.id }).select("_id title");
  const jobIds = jobs.map((j) => j._id);
  const jobMap = new Map(jobs.map((j) => [j._id.toString(), j.title]));
  const applications = await Application.find({ jobId: { $in: jobIds } }).sort({ createdAt: -1 }).limit(50);
  const devIds = [...new Set(applications.map((a) => a.developerId.toString()))];
  const users = await User.find({ _id: { $in: devIds } }).select("_id fullName");
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));
  return res.json(
    applications.map((a) => ({
      id: a._id.toString(),
      developerId: a.developerId.toString(),
      developerName: userMap.get(a.developerId.toString()),
      jobId: a.jobId.toString(),
      jobTitle: jobMap.get(a.jobId.toString()),
      coverLetter: a.coverLetter,
      status: a.status,
      createdAt: a.createdAt
    }))
  );
});

export default router;
