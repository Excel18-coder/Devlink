import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  requiredSkills: z.array(z.string()).optional(),
  experienceLevel: z.enum(["junior", "mid", "senior"]).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  rateType: z.enum(["hourly", "monthly", "project"]).optional(),
  jobType: z.enum(["remote", "onsite", "contract"]).optional(),
  location: z.string().optional()
});

export const updateJobSchema = createJobSchema.partial();
