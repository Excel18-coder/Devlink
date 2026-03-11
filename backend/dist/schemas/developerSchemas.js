import { z } from "zod";
export const updateDeveloperSchema = z.object({
    bio: z.string().max(2000).optional(),
    skills: z.array(z.string().max(60)).max(30).optional(),
    yearsExperience: z.number().min(0).max(50).optional(),
    portfolioLinks: z.array(z.string().url().max(500)).max(10).optional(),
    githubUrl: z.string().url().max(500).optional().or(z.literal("")),
    availability: z.enum(["full-time", "part-time", "contract"]).optional(),
    rateType: z.enum(["hourly", "monthly", "project"]).optional(),
    rateAmount: z.number().min(0).max(100_000).optional(),
    location: z.string().max(200).optional()
});
