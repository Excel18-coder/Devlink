import { z } from "zod";
export declare const createApplicationSchema: z.ZodObject<{
    coverLetter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    coverLetter?: string | undefined;
}, {
    coverLetter?: string | undefined;
}>;
