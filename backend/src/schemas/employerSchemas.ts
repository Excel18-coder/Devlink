import { z } from "zod";

export const updateEmployerSchema = z.object({
  companyName: z.string().min(1).optional(),
  website: z.string().url().optional(),
  about: z.string().optional(),
  location: z.string().optional()
});
