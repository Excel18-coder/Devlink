import { Router, Response } from "express";
import { Review } from "../models/Review.js";
import { Contract } from "../models/Contract.js";
import { Developer } from "../models/Developer.js";
import { User } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../schemas/reviewSchemas.js";

const router = Router();

router.post("/", requireAuth, validate(createReviewSchema), async (req: AuthRequest, res: Response) => {
  const { contractId, revieweeId, rating, comment } = req.body;

  const contract = await Contract.findById(contractId);
  if (!contract) return res.status(404).json({ message: "Contract not found" });
  if (contract.status !== "completed") return res.status(400).json({ message: "Contract not completed" });
  if (contract.employerId.toString() !== req.user!.id && contract.developerId.toString() !== req.user!.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const review = await Review.create({ contractId, reviewerId: req.user!.id, revieweeId, rating, comment: comment ?? undefined });

  const avgResult = await Review.aggregate([{ $match: { revieweeId: review.revieweeId } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]);
  const avg = avgResult[0]?.avg ?? 0;
  await Developer.findOneAndUpdate({ userId: revieweeId }, { ratingAvg: Math.round(avg * 10) / 10 });

  return res.status(201).json({ id: review._id.toString() });
});

router.get("/user/:id", async (req, res) => {
  const reviews = await Review.find({ revieweeId: req.params.id }).sort({ createdAt: -1 });
  const reviewerIds = reviews.map((r) => r.reviewerId.toString());
  const users = await User.find({ _id: { $in: reviewerIds } }).select("_id fullName");
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));

  return res.json(
    reviews.map((r) => ({
      id: r._id.toString(),
      contractId: r.contractId.toString(),
      reviewerName: userMap.get(r.reviewerId.toString()),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt
    }))
  );
});

// Authenticated user's received reviews
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const reviews = await Review.find({ revieweeId: req.user!.id }).sort({ createdAt: -1 });
  const reviewerIds = reviews.map((r) => r.reviewerId.toString());
  const users = await User.find({ _id: { $in: reviewerIds } }).select("_id fullName");
  const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));
  return res.json(
    reviews.map((r) => ({
      id: r._id.toString(),
      reviewerName: userMap.get(r.reviewerId.toString()),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt
    }))
  );
});

export default router;
