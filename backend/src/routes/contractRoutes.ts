import { Router, Response } from "express";
import { Contract } from "../models/Contract.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { createContractSchema } from "../schemas/contractSchemas.js";
import { createAuditLog } from "../services/auditService.js";
import { uploadSubmission } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const router = Router();

// ─── Create contract ────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole("employer"), validate(createContractSchema), async (req: AuthRequest, res: Response) => {
  const { jobId, developerId, milestones } = req.body;

  const parsedMilestones = (milestones ?? []).map(
    (ms: { title: string; amount: number; dueDate?: string }) => ({
      title: ms.title,
      amount: ms.amount,
      dueDate: ms.dueDate ? new Date(ms.dueDate) : undefined
    })
  );

  const totalAmount = parsedMilestones.reduce(
    (sum: number, ms: { amount: number }) => sum + ms.amount,
    0
  );

  const contract = await Contract.create({
    jobId: jobId ?? undefined,
    employerId: req.user!.id,
    developerId,
    status: "active",
    totalAmount,
    milestones: parsedMilestones
  });

  await createAuditLog({
    actorId: req.user!.id,
    action: "contract_create",
    entity: "contract",
    entityId: contract._id.toString(),
    metadata: { developerId, totalAmount, milestoneCount: parsedMilestones.length }
  });

  return res.status(201).json({ id: contract._id.toString() });
});

// ─── Developer: save payment details (bank/mobile money info for off-site payments) ──
router.post("/:id/payment-details", requireAuth, requireRole("developer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.developerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const { method, accountName, details } = req.body;
  if (!method || !["bank_transfer", "mobile_money", "other"].includes(method)) {
    return res.status(400).json({ message: "Valid payment method is required (bank_transfer, mobile_money, or other)" });
  }
  if (!details?.trim()) {
    return res.status(400).json({ message: "Payment details are required (e.g. account number, phone number)" });
  }

  contract.developerPaymentDetails = {
    method,
    accountName: accountName?.trim() ?? "",
    details: details.trim(),
    updatedAt: new Date()
  };
  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "payment_details_update",
    entity: "contract",
    entityId: contract._id.toString(),
    metadata: { method }
  });

  return res.json({ message: "Payment details saved" });
});

// ─── Developer: submit preview/demo link for employer review ───────────────
router.post("/:id/milestones/:msId/submit", requireAuth, requireRole("developer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.developerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const milestone = contract.milestones.id(req.params.msId);
  if (!milestone) return res.status(404).json({ message: "Milestone not found" });
  if (milestone.status !== "pending") return res.status(400).json({ message: "Only pending milestones can be submitted" });

  const { submissionLink, submissionNote } = req.body;
  if (!submissionLink?.trim()) {
    return res.status(400).json({ message: "A preview/demo link is required (e.g. Vercel or Netlify URL)" });
  }

  milestone.status = "submitted";
  milestone.submissionLink = submissionLink.trim();
  if (submissionNote?.trim()) milestone.submissionNote = submissionNote.trim();
  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "milestone_submit",
    entity: "milestone",
    entityId: req.params.msId,
    metadata: { contractId: req.params.id, milestoneTitle: milestone.title }
  });

  return res.json({ message: "Work submitted for employer review" });
});

// ─── Employer: approve & release milestone (confirms payment was sent off-site) ──
router.post("/:id/milestones/:msId/release", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const milestone = contract.milestones.id(req.params.msId);
  if (!milestone) return res.status(404).json({ message: "Milestone not found" });
  if (milestone.status !== "submitted") return res.status(400).json({ message: "Milestone must be submitted before it can be released" });

  milestone.status = "released";
  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "milestone_release",
    entity: "milestone",
    entityId: req.params.msId,
    metadata: { contractId: req.params.id, milestoneTitle: milestone.title }
  });

  return res.json({ message: "Milestone released. Developer will now submit final deliverables." });
});

// ─── Developer: deliver final ZIP + official domain after payment ────────────
router.post("/:id/milestones/:msId/deliver", requireAuth, requireRole("developer"), uploadSubmission.single("deliveryFile"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.developerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const milestone = contract.milestones.id(req.params.msId);
  if (!milestone) return res.status(404).json({ message: "Milestone not found" });
  if (milestone.status !== "released") return res.status(400).json({ message: "Milestone must be released (payment confirmed) before final delivery" });

  const { finalLink } = req.body;
  if (!finalLink?.trim()) {
    return res.status(400).json({ message: "The official hosted domain/link is required" });
  }

  let finalFileUrl: string | undefined;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "deliveries",
        resource_type: "raw",
        public_id: `delivery_${req.params.id}_${req.params.msId}`
      });
      finalFileUrl = result.secureUrl;
    } catch {
      return res.status(500).json({ message: "File upload failed. Please try again." });
    }
  }

  milestone.status = "delivered";
  milestone.finalLink = finalLink.trim();
  if (finalFileUrl) milestone.finalFileUrl = finalFileUrl;
  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "milestone_deliver",
    entity: "milestone",
    entityId: req.params.msId,
    metadata: { contractId: req.params.id, milestoneTitle: milestone.title, hasFile: !!finalFileUrl }
  });

  return res.json({ message: "Final deliverables submitted." });
});

// ─── Employer: add a new milestone to an active contract ────────────────────
router.post("/:id/milestones", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  if (contract.status !== "active") return res.status(400).json({ message: "Can only add milestones to an active contract" });

  const { title, amount, dueDate } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Milestone title is required" });
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ message: "Milestone amount must be a positive number" });

  contract.milestones.push({
    title: title.trim(),
    amount: parsedAmount,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status: "pending"
  } as never);
  contract.totalAmount += parsedAmount;
  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "milestone_add",
    entity: "contract",
    entityId: contract._id.toString(),
    metadata: { title: title.trim(), amount: parsedAmount }
  });

  return res.status(201).json({ message: "Milestone added", totalAmount: contract.totalAmount });
});

// ─── Employer: mark contract as complete (all milestones delivered) ───────────
router.post("/:id/complete", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  if (contract.status !== "active") return res.status(400).json({ message: "Contract is not active" });

  const allDelivered = contract.milestones.every((m) => m.status === "delivered");
  if (!allDelivered) return res.status(400).json({ message: "All milestones must be delivered before completing the contract" });

  await Contract.findByIdAndUpdate(req.params.id, { status: "completed" });

  await createAuditLog({
    actorId: req.user!.id,
    action: "contract_complete",
    entity: "contract",
    entityId: contract._id.toString()
  });

  return res.json({ message: "Contract marked as complete" });
});

// ─── Employer: terminate (cancel) an active contract ────────────────────────
router.post("/:id/terminate", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  if (!["active", "disputed"].includes(contract.status)) {
    return res.status(400).json({ message: "Only active or disputed contracts can be terminated" });
  }

  const { reason } = req.body;
  await Contract.findByIdAndUpdate(req.params.id, { status: "cancelled" });

  await createAuditLog({
    actorId: req.user!.id,
    action: "contract_terminate",
    entity: "contract",
    entityId: req.params.id,
    metadata: { reason: reason?.trim() ?? "" }
  });

  return res.json({ message: "Contract terminated" });
});

// ─── Employer: edit a pending milestone ──────────────────────────────────────
router.patch("/:id/milestones/:msId", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const milestone = contract.milestones.id(req.params.msId);
  if (!milestone) return res.status(404).json({ message: "Milestone not found" });
  if (milestone.status !== "pending") return res.status(400).json({ message: "Only pending milestones can be edited" });

  const { title, amount, dueDate } = req.body;
  const oldAmount = milestone.amount;

  if (title?.trim()) milestone.title = title.trim();
  if (amount !== undefined) {
    const parsed = Number(amount);
    if (isNaN(parsed) || parsed <= 0) return res.status(400).json({ message: "Amount must be a positive number" });
    milestone.amount = parsed;
    contract.totalAmount = contract.totalAmount - oldAmount + parsed;
  }
  if (dueDate !== undefined) milestone.dueDate = dueDate ? new Date(dueDate) : undefined;

  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "milestone_edit",
    entity: "milestone",
    entityId: req.params.msId,
    metadata: { contractId: req.params.id }
  });

  return res.json({ message: "Milestone updated", totalAmount: contract.totalAmount });
});

// ─── Employer: delete a pending milestone ────────────────────────────────────
router.delete("/:id/milestones/:msId", requireAuth, requireRole("employer"), async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.employerId.toString() !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const milestone = contract.milestones.id(req.params.msId);
  if (!milestone) return res.status(404).json({ message: "Milestone not found" });
  if (milestone.status !== "pending") return res.status(400).json({ message: "Only pending milestones can be deleted" });

  contract.totalAmount -= milestone.amount;
  milestone.deleteOne();
  await contract.save();

  await createAuditLog({
    actorId: req.user!.id,
    action: "milestone_delete",
    entity: "milestone",
    entityId: req.params.msId,
    metadata: { contractId: req.params.id }
  });

  return res.json({ message: "Milestone deleted", totalAmount: contract.totalAmount });
});

// ─── Dispute contract ────────────────────────────────────────────────────────
router.post("/:id/dispute", requireAuth, async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (
    contract.employerId.toString() !== req.user!.id &&
    contract.developerId.toString() !== req.user!.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (!["active", "disputed"].includes(contract.status)) {
    return res.status(400).json({ message: "Only active contracts can be disputed" });
  }
  await Contract.findByIdAndUpdate(req.params.id, { status: "disputed" });

  await createAuditLog({
    actorId: req.user!.id,
    action: "contract_dispute",
    entity: "contract",
    entityId: req.params.id
  });

  return res.json({ message: "Dispute raised. Admin will review." });
});

// ─── List contracts ──────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { role, id } = req.user!;
  let filter: Record<string, unknown> = {};
  if (role === "developer") filter = { developerId: id };
  else if (role === "employer") filter = { employerId: id };

  const contracts = await Contract.find(filter).sort({ createdAt: -1 }).limit(role === "admin" ? 100 : 1000);
  return res.json(
    contracts.map((c) => ({
      id: c._id.toString(),
      jobId: c.jobId?.toString(),
      employerId: c.employerId.toString(),
      developerId: c.developerId.toString(),
      status: c.status,
      totalAmount: c.totalAmount,
      developerPaymentDetails: c.developerPaymentDetails ?? null,
      createdAt: c.createdAt
    }))
  );
});

// ─── Get single contract with milestone submission details ───────────────────
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (
    req.user!.role !== "admin" &&
    contract.employerId.toString() !== req.user!.id &&
    contract.developerId.toString() !== req.user!.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({
    id: contract._id.toString(),
    jobId: contract.jobId?.toString(),
    employerId: contract.employerId.toString(),
    developerId: contract.developerId.toString(),
    status: contract.status,
    totalAmount: contract.totalAmount,
    developerPaymentDetails: contract.developerPaymentDetails ?? null,
    createdAt: contract.createdAt,
    milestones: contract.milestones.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      amount: m.amount,
      dueDate: m.dueDate,
      status: m.status,
      submissionLink: m.submissionLink ?? null,
      submissionNote: m.submissionNote ?? null,
      finalLink: m.finalLink ?? null,
      finalFileUrl: m.finalFileUrl ?? null
    }))
  });
});

export default router;
