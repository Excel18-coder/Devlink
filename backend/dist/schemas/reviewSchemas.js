import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const createReviewSchema = z.object({
    contractId: objectId,
    revieweeId: objectId,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional()
});
