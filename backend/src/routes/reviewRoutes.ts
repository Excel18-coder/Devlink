import { Router } from "express";
import { Review } from "../models/Review.js";
import { Contract } from "../models/Contract.js";
import { Developer } from "../models/Developer.js";
import { User } from "../models/User.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../schemas/reviewSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectIds } from "../middleware/validateObjectIds.js";

const router = Router();
router.use(validateObjectIds);

// ─── Submit a review ──────────────────────────────────────────────────────────
router.post("/", requireAuth, validate(createReviewSchema), asyncHandler<AuthRequest>(async (req, res) => {
  const { contractId, revieweeId, rating, comment } = req.body;

  // Prevent self-review
  if (revieweeId === req.user!.id) {
    return res.status(400).json({ message: "You cannot review yourself" });
  }

  const contract = await Contract.findById(contractId).lean();
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.status !== "completed") return res.status(400).json({ message: "Contract not completed" });
  if (contract.employerId.toString() !== req.user!.id && contract.developerId.toString() !== req.user!.id) {
    return res.status(403).json({ message: "Forbidden" });
  }
  // Reviewer must be reviewing the other party of the contract
  const validReviewee =
    (req.user!.id === contract.employerId.toString() && revieweeId === contract.developerId.toString()) ||
    (req.user!.id === contract.developerId.toString() && revieweeId === contract.employerId.toString());
  if (!validReviewee) {
    return res.status(400).json({ message: "You can only review the other party of this contract" });
  }

  // One review per reviewer per contract
  const duplicate = await Review.findOne({ contractId, reviewerId: req.user!.id }).lean();
  if (duplicate) return res.status(400).json({ message: "You have already reviewed this contract" });

  const review = await Review.create({ contractId, reviewerId: req.user!.id, revieweeId, rating, comment: comment ?? undefined });

  // Recalculate and persist the reviewee's average rating
  const avgResult = await Review.aggregate([
    { $match: { revieweeId: review.revieweeId } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  const avg = avgResult[0]?.avg ?? 0;
  await Developer.findOneAndUpdate({ userId: revieweeId }, { ratingAvg: Math.round(avg * 10) / 10 });

  return res.status(201).json({ id: review._id.toString() });
}));

  // Recalculate and persist the reviewee's average rating
  const avgResult = await Review.aggregate([
    { $match: { revieweeId: review.revieweeId } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  const avg = avgResult[0]?.avg ?? 0;
  await Developer.findOneAndUpdate({ userId: revieweeId }, { ratingAvg: Math.round(avg * 10) / 10 });

  return res.status(201).json({ id: review._id.toString() });
}));

// ─── Public: reviews for a user ──────────────────────────────────────────────
router.get("/user/:id", asyncHandler(async (req, res) => {
  const reviews = await Review.find({ revieweeId: req.params.id }).sort({ createdAt: -1 }).lean();
  const reviewerIds = reviews.map((r) => r.reviewerId.toString());
  const users = await User.find({ _id: { $in: reviewerIds } }).select("_id fullName").lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));

  return res.json(
    reviews.map((r) => ({
      id: r._id.toString(),
      contractId: r.contractId.toString(),
      reviewerName: userMap.get(r.reviewerId.toString()),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }))
  );
}));

// ─── Auth: own received reviews ──────────────────────────────────────────────
router.get("/me", requireAuth, asyncHandler<AuthRequest>(async (req, res) => {
  const reviews = await Review.find({ revieweeId: req.user!.id }).sort({ createdAt: -1 }).lean();
  const reviewerIds = reviews.map((r) => r.reviewerId.toString());
  const users = await User.find({ _id: { $in: reviewerIds } }).select("_id fullName").lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));
  return res.json(
    reviews.map((r) => ({
      id: r._id.toString(),
      reviewerName: userMap.get(r.reviewerId.toString()),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }))
  );
}));

export default router;
