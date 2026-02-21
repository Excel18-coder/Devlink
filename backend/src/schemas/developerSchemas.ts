import { z } from "zod";

export const updateDeveloperSchema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).optional(),
  portfolioLinks: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional(),
  availability: z.enum(["full-time", "part-time", "contract"]).optional(),
  rateType: z.enum(["hourly", "monthly", "project"]).optional(),
  rateAmount: z.number().min(0).optional(),
  location: z.string().optional()
});
