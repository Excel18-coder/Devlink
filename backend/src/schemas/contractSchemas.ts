import { z } from "zod";

export const createContractSchema = z.object({
  jobId: z.string().min(1).optional(),
  developerId: z.string().min(1),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1),
        amount: z.number().min(0),
        dueDate: z.string().optional()
      })
    )
    .optional()
});
