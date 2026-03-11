import { z } from "zod";
export declare const updateEmployerSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    about: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    location?: string | undefined;
    companyName?: string | undefined;
    website?: string | undefined;
    about?: string | undefined;
}, {
    location?: string | undefined;
    companyName?: string | undefined;
    website?: string | undefined;
    about?: string | undefined;
}>;
