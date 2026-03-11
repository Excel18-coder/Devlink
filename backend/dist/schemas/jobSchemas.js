import { z } from "zod";
export const createJobSchema = z.object({
    title: z.string().min(3).max(150),
    description: z.string().min(10).max(10_000),
    requiredSkills: z.array(z.string().max(60)).max(30).optional(),
    experienceLevel: z.enum(["junior", "mid", "senior"]).optional(),
    budgetMin: z.number().min(0).max(1_000_000).optional(),
    budgetMax: z.number().min(0).max(1_000_000).optional(),
    rateType: z.enum(["hourly", "monthly", "project"]).optional(),
    jobType: z.enum(["remote", "onsite", "contract"]).optional(),
    location: z.string().max(200).optional()
});
export const updateJobSchema = createJobSchema.partial();
