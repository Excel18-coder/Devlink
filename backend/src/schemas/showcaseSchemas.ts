import { z } from "zod";

export const createShowcaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  tagline: z.string().min(10, "Tagline must be at least 10 characters").max(200, "Tagline must be at most 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be at most 2000 characters"),
  techStack: z.array(z.string().min(1)).min(1, "Add at least one technology").max(20),
  projectUrl: z.string().url("Live demo URL must be a valid URL (include https://)").optional().or(z.literal("")),
  repoUrl: z.string().url("Repository URL must be a valid URL (include https://)").optional().or(z.literal("")),
  category: z.enum(["fintech", "agritech", "medtech", "biotech", "ecommerce", "climatetech", "engineering", "edtech", "proptech", "logistics", "ai", "web", "mobile", "other"]).default("web"),
  lookingFor: z.enum(["employers", "investors", "both"]).default("both"),
  status: z.enum(["active", "draft"]).default("active")
});

export const updateShowcaseSchema = createShowcaseSchema.partial();
