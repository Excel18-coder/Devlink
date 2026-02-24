import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Developer } from "../models/Developer.js";
import { Employer } from "../models/Employer.js";
import { Job } from "../models/Job.js";
import { Contract } from "../models/Contract.js";
import { Application } from "../models/Application.js";
import { Showcase } from "../models/Showcase.js";
import { AuditLog } from "../models/AuditLog.js";
import { AdminConfig } from "../models/AdminConfig.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get("/analytics", requireAuth, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsers, totalDevelopers, totalEmployers, openJobs, activeContracts,
    userTrend, recentUsers, recentJobs,
    contractsByStatusAgg, contractsTrend,
    totalEscrowAgg, totalPaidOutAgg,
    jobsByStatusAgg, jobsByTypeAgg,
    usersByRoleAgg, totalApplications, showcaseCount, commissionDoc
  ] = await Promise.all([
    User.countDocuments(),
    Developer.countDocuments(),
    Employer.countDocuments(),
    Job.countDocuments({ status: "open" }),
    Contract.countDocuments({ status: "active" }),
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select("email fullName role createdAt"),
    Job.find().sort({ createdAt: -1 }).limit(5).select("title status createdAt"),
    // contracts by status counts
    Contract.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    // contracts monthly trend
    Contract.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
        value: { $sum: "$totalAmount" }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    // escrow = active contracts total
    Contract.aggregate([{ $match: { status: "active" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    // paid out = completed contracts total
    Contract.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Job.aggregate([{ $group: { _id: "$jobType", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Application.countDocuments(),
    Showcase.countDocuments({ status: "active" }),
    AdminConfig.findOne({ key: "commission_pct" })
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months: { label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  type TrendRow = { _id: { year: number; month: number }; count: number };
  type TrendValueRow = TrendRow & { value: number };
  type AggRow = { _id: string; count: number };

  const userTrendMap = new Map((userTrend as TrendRow[]).map((r) => [`${r._id.year}-${r._id.month}`, r.count]));
  const userGrowth = months.map((m) => ({ month: m.label, users: userTrendMap.get(`${m.year}-${m.month}`) ?? 0 }));

  const contractsTrendMap = new Map((contractsTrend as TrendValueRow[]).map((r) => [`${r._id.year}-${r._id.month}`, { count: r.count, value: r.value }]));
  const contractGrowth = months.map((m) => {
    const d = contractsTrendMap.get(`${m.year}-${m.month}`);
    return { month: m.label, contracts: d?.count ?? 0, value: d?.value ?? 0 };
  });

  const contractStatusMap = new Map((contractsByStatusAgg as AggRow[]).map((r) => [r._id, r.count]));
  const jobStatusMap     = new Map((jobsByStatusAgg  as AggRow[]).map((r) => [r._id, r.count]));
  const jobTypeMap       = new Map((jobsByTypeAgg    as AggRow[]).map((r) => [r._id, r.count]));
  const roleMap          = new Map((usersByRoleAgg   as AggRow[]).map((r) => [r._id, r.count]));

  const totalPaidOutVal = ((totalPaidOutAgg as { total?: number }[])[0]?.total ?? 0);
  const commissionPct   = commissionDoc ? Number(commissionDoc.value) : 0;
  const totalRevenue    = (totalPaidOutVal * commissionPct) / 100;

  return res.json({
    totalUsers, totalDevelopers, totalEmployers, openJobs, activeContracts,
    totalApplications, showcaseCount,
    totalEscrow: ((totalEscrowAgg as { total?: number }[])[0]?.total ?? 0),
    totalPaidOut: totalPaidOutVal,
    totalRevenue,
    userGrowth,
    contractGrowth,
    contractsByStatus: {
      active:    contractStatusMap.get("active")    ?? 0,
      completed: contractStatusMap.get("completed") ?? 0,
      cancelled: contractStatusMap.get("cancelled") ?? 0,
      disputed:  contractStatusMap.get("disputed")  ?? 0,
    },
    jobsByStatus: {
      open:   jobStatusMap.get("open")   ?? 0,
      closed: jobStatusMap.get("closed") ?? 0,
      paused: jobStatusMap.get("paused") ?? 0,
    },
    jobsByType: {
      remote:   jobTypeMap.get("remote")   ?? 0,
      contract: jobTypeMap.get("contract") ?? 0,
      onsite:   jobTypeMap.get("onsite")   ?? 0,
    },
    usersByRole: {
      developer: roleMap.get("developer") ?? 0,
      employer:  roleMap.get("employer")  ?? 0,
      admin:     roleMap.get("admin")     ?? 0,
    },
    recentUsers: recentUsers.map((u) => ({ id: u._id.toString(), email: u.email, fullName: u.fullName, role: u.role, createdAt: u.createdAt })),
    recentJobs:  recentJobs.map((j) => ({ id: j._id.toString(), title: j.title, status: j.status, createdAt: j.createdAt }))
  });
});

// SSE endpoint for real-time analytics streaming
router.get("/analytics/stream", requireAuth, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendSnapshot = async () => {
    try {
      const [totalUsers, openJobs, activeContracts] = await Promise.all([
        User.countDocuments(),
        Job.countDocuments({ status: "open" }),
        Contract.countDocuments({ status: "active" })
      ]);
      const data = JSON.stringify({ totalUsers, openJobs, activeContracts, ts: Date.now() });
      res.write(`data: ${data}\n\n`);
    } catch { /* ignore */ }
  };

  await sendSnapshot();
  const interval = setInterval(sendSnapshot, 15000);
  res.on("close", () => clearInterval(interval));
});

router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { role, status, search, page = "1", limit = "20" } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = {};
  if (role) filter.role = String(role);
  if (status) filter.status = String(status);
  if (search) filter.$or = [{ email: new RegExp(String(search), "i") }, { fullName: new RegExp(String(search), "i") }];

  const users = await User.find(filter).sort({ createdAt: -1 }).skip(offset).limit(Number(limit)).select("email role fullName status createdAt");
  return res.json(users.map((u) => ({ id: u._id.toString(), email: u.email, role: u.role, fullName: u.fullName, status: u.status, createdAt: u.createdAt })));
});

router.patch("/users/:id/status", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!["active", "suspended", "pending"].includes(status)) return res.status(400).json({ message: "Invalid status" });
  await User.findByIdAndUpdate(req.params.id, { status });
  return res.json({ message: "User status updated" });
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  await User.findByIdAndDelete(req.params.id);
  return res.json({ message: "User deleted" });
});

router.patch("/users/:id/role", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (!["developer", "employer", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
  await User.findByIdAndUpdate(req.params.id, { role });
  return res.json({ message: "User role updated" });
});

router.get("/jobs", requireAuth, requireRole("admin"), async (_req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(100);
  const empIds = jobs.map((j) => j.employerId.toString());
  const employers = await Employer.find({ userId: { $in: empIds } }).select("userId companyName");
  const empMap = new Map(employers.map((e) => [e.userId.toString(), e.companyName]));
  return res.json(jobs.map((j) => ({ id: j._id.toString(), title: j.title, status: j.status, companyName: empMap.get(j.employerId.toString()), createdAt: j.createdAt })));
});

router.patch("/jobs/:id/status", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!["open", "closed", "paused"].includes(status)) return res.status(400).json({ message: "Invalid status" });
  await Job.findByIdAndUpdate(req.params.id, { status });
  return res.json({ message: "Job status updated" });
});

router.delete("/jobs/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  return res.json({ message: "Job deleted" });
});

router.get("/config", requireAuth, requireRole("admin"), async (_req, res) => {
  const configs = await AdminConfig.find();
  const config: Record<string, string> = {};
  configs.forEach((c) => (config[c.key] = c.value));
  return res.json(config);
});

router.patch("/config", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { key, value } = req.body;
  if (!key || value === undefined || value === "") return res.status(400).json({ message: "Key and value are required" });
  if (key === "commission_pct") {
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > 100) return res.status(400).json({ message: "commission_pct must be a number between 0 and 100" });
  }
  if (key === "max_file_size_mb") {
    const num = Number(value);
    if (isNaN(num) || num <= 0) return res.status(400).json({ message: "max_file_size_mb must be a positive number" });
  }
  if (key === "maintenance_mode" && !["true", "false"].includes(String(value).toLowerCase())) {
    return res.status(400).json({ message: "maintenance_mode must be 'true' or 'false'" });
  }
  await AdminConfig.findOneAndUpdate({ key }, { value: String(value) }, { upsert: true });
  return res.json({ message: "Config updated" });
});

router.patch("/config/bulk", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const updates: Record<string, string> = req.body;
  if (!updates || typeof updates !== "object") return res.status(400).json({ message: "Body must be a key-value object" });
  const errors: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") { errors.push(`${key}: value is required`); continue; }
    if (key === "commission_pct") {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) { errors.push("commission_pct must be a number between 0 and 100"); continue; }
    }
    if (key === "max_file_size_mb") {
      const num = Number(value);
      if (isNaN(num) || num <= 0) { errors.push("max_file_size_mb must be a positive number"); continue; }
    }
    if (key === "maintenance_mode" && !["true", "false"].includes(String(value).toLowerCase())) {
      errors.push("maintenance_mode must be 'true' or 'false'"); continue;
    }
    await AdminConfig.findOneAndUpdate({ key }, { value: String(value) }, { upsert: true });
  }
  if (errors.length) return res.status(400).json({ message: "Some entries failed", errors });
  return res.json({ message: "Config updated" });
});

router.delete("/config/:key", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const PROTECTED = ["commission_pct", "maintenance_mode", "max_file_size_mb"];
  if (PROTECTED.includes(key)) return res.status(400).json({ message: `Config key "${key}" is protected and cannot be deleted` });
  const result = await AdminConfig.findOneAndDelete({ key });
  if (!result) return res.status(404).json({ message: "Config key not found" });
  return res.json({ message: "Config key deleted" });
});

router.get("/disputes", requireAuth, requireRole("admin"), async (_req, res) => {
  const contracts = await Contract.find({ status: "disputed" }).sort({ updatedAt: -1 });
  return res.json(contracts.map((c) => ({ id: c._id.toString(), employerId: c.employerId.toString(), developerId: c.developerId.toString(), status: c.status, totalAmount: c.totalAmount, createdAt: c.createdAt })));
});

router.post("/disputes/:id/resolve", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { resolution } = req.body;
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.status !== "disputed") return res.status(400).json({ message: "Contract not in dispute" });

  const newStatus = resolution === "release" ? "completed" : "cancelled";
  await Contract.findByIdAndUpdate(req.params.id, { status: newStatus });
  return res.json({ message: "Dispute resolved" });
});

router.get("/audit-logs", requireAuth, requireRole("admin"), async (req, res) => {
  const { entity, action, page = "1", limit = "50" } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = {};
  if (entity) filter.entity = String(entity);
  if (action) filter.action = String(action);

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip(offset).limit(Number(limit)).populate("actorId", "email");
  return res.json(
    logs.map((l) => ({
      id: l._id.toString(),
      actorId: l.actorId?.toString(),
      actorEmail: (l.actorId as { email?: string } | null)?.email,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId?.toString(),
      metadata: l.metadata,
      createdAt: l.createdAt
    }))
  );
});

router.post("/create-admin", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { email, password, fullName } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash: hash, role: "admin", fullName });
  return res.status(201).json({ id: user._id.toString() });
});

// ─── CONTRACTS ─────────────────────────────────────────────────────────────
router.get("/contracts", requireAuth, requireRole("admin"), async (_req, res) => {
  const contracts = await Contract.find().sort({ createdAt: -1 }).limit(200);

  // Gather unique employer and developer user IDs
  const empUserIds = contracts.map((c) => c.employerId.toString());
  const devUserIds = contracts.map((c) => c.developerId.toString());
  const allUserIds = [...new Set([...empUserIds, ...devUserIds])];

  const [users, employers] = await Promise.all([
    User.find({ _id: { $in: allUserIds } }).select("_id fullName email"),
    Employer.find({ userId: { $in: empUserIds } }).select("userId companyName")
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), { fullName: u.fullName, email: u.email }]));
  const empCompanyMap = new Map(employers.map((e) => [e.userId.toString(), e.companyName]));

  return res.json(
    contracts.map((c) => {
      const empId = c.employerId.toString();
      const devId = c.developerId.toString();
      return {
        id: c._id.toString(),
        employerId: empId,
        employerName: userMap.get(empId)?.fullName ?? "Unknown",
        employerEmail: userMap.get(empId)?.email ?? "",
        employerCompany: empCompanyMap.get(empId) ?? "",
        developerId: devId,
        developerName: userMap.get(devId)?.fullName ?? "Unknown",
        developerEmail: userMap.get(devId)?.email ?? "",
        status: c.status,
        totalAmount: c.totalAmount,
        createdAt: c.createdAt,
        developerPaymentDetails: c.developerPaymentDetails ?? null,
        milestones: c.milestones.map((m) => ({
          id: (m as { _id?: { toString(): string } })._id?.toString() ?? "",
          title: m.title,
          amount: m.amount,
          status: m.status,
          submissionLink: m.submissionLink ?? null,
          finalLink: m.finalLink ?? null,
          finalFileUrl: m.finalFileUrl ?? null
        }))
      };
    })
  );
});

// ─── EMPLOYERS ─────────────────────────────────────────────────────────────
router.get("/employers", requireAuth, requireRole("admin"), async (_req, res) => {
  const employers = await Employer.find().sort({ createdAt: -1 });
  const userIds = employers.map((e) => e.userId.toString());

  const [users, jobCounts, contractCounts] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("_id fullName email status createdAt"),
    Job.aggregate([
      { $match: { employerId: { $in: employers.map((e) => e.userId) } } },
      { $group: { _id: "$employerId", count: { $sum: 1 } } }
    ]),
    Contract.aggregate([
      { $match: { employerId: { $in: employers.map((e) => e.userId) } } },
      { $group: { _id: "$employerId", count: { $sum: 1 } } }
    ])
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const jobCountMap = new Map(jobCounts.map((r: { _id: { toString(): string }; count: number }) => [r._id.toString(), r.count]));
  const contractCountMap = new Map(contractCounts.map((r: { _id: { toString(): string }; count: number }) => [r._id.toString(), r.count]));

  return res.json(
    employers.map((e) => {
      const uid = e.userId.toString();
      const u = userMap.get(uid);
      return {
        id: e._id.toString(),
        userId: uid,
        companyName: e.companyName,
        website: e.website ?? null,
        about: e.about ?? null,
        location: e.location ?? null,
        avatarUrl: e.avatarUrl ?? null,
        fullName: u?.fullName ?? "",
        email: u?.email ?? "",
        userStatus: u?.status ?? "active",
        memberSince: u?.createdAt ?? e.createdAt,
        jobCount: jobCountMap.get(uid) ?? 0,
        contractCount: contractCountMap.get(uid) ?? 0,
        createdAt: e.createdAt
      };
    })
  );
});

export default router;
