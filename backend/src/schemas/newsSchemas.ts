import { z } from "zod";

export const createNewsSchema = z.object({
  title:    z.string().min(3, "Title too short").max(200, "Title too long"),
  body:     z.string().min(10, "Body too short").max(50_000, "Body too long"),
  excerpt:  z.string().max(500, "Excerpt too long").optional().default(""),
  category: z.enum(["jobs", "platform", "announcement", "industry", "general"]).default("general"),
  imageUrl: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || /^https?:\/\/.+/.test(v), { message: "Must be a valid URL" }),
  status:   z.enum(["draft", "published"]).default("draft"),
});

export const updateNewsSchema = createNewsSchema.partial();
