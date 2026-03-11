import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const createContractSchema = z.object({
    jobId: objectId.optional(),
    developerId: objectId,
    milestones: z
        .array(z.object({
        title: z.string().min(1).max(200),
        amount: z.number().min(0).max(1_000_000),
        dueDate: z.string().optional()
    }))
        .max(50)
        .optional()
});
