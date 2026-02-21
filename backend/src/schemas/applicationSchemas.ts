import { z } from "zod";

export const createApplicationSchema = z.object({
  coverLetter: z.string().optional()
});
