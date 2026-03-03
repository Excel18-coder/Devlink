import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import NewsPost from "../models/NewsPost.js";

const router = Router();

/** GET /api/news
 *  Public — paginated list of published posts.
 *  Query: page, limit (max 20), category
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page     = Math.max(1, parseInt(String(req.query.page  ?? "1"), 10));
    const limit    = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10)));
    const skip     = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const filter: Record<string, unknown> = { status: "published" };
    if (category && ["jobs", "platform", "announcement", "industry", "general"].includes(category)) {
      filter.category = category;
    }

    const [posts, total] = await Promise.all([
      NewsPost.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-body")   // omit body for list — send excerpt only
        .lean(),
      NewsPost.countDocuments(filter),
    ]);

    return res.json({
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  }),
);

/** GET /api/news/:idOrSlug
 *  Public — fetch single published post by MongoDB id or slug.
 */
router.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    // Try ObjectId first, fall back to slug
    const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const post = isObjectId
      ? await NewsPost.findOne({ _id: idOrSlug, status: "published" }).lean()
      : await NewsPost.findOne({ slug: idOrSlug, status: "published" }).lean();

    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json(post);
  }),
);

export default router;
