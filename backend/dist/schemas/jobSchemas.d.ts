import { z } from "zod";
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    experienceLevel: z.ZodOptional<z.ZodEnum<["junior", "mid", "senior"]>>;
    budgetMin: z.ZodOptional<z.ZodNumber>;
    budgetMax: z.ZodOptional<z.ZodNumber>;
    rateType: z.ZodOptional<z.ZodEnum<["hourly", "monthly", "project"]>>;
    jobType: z.ZodOptional<z.ZodEnum<["remote", "onsite", "contract"]>>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    rateType?: "hourly" | "monthly" | "project" | undefined;
    location?: string | undefined;
    requiredSkills?: string[] | undefined;
    experienceLevel?: "junior" | "mid" | "senior" | undefined;
    budgetMin?: number | undefined;
    budgetMax?: number | undefined;
    jobType?: "contract" | "remote" | "onsite" | undefined;
}, {
    description: string;
    title: string;
    rateType?: "hourly" | "monthly" | "project" | undefined;
    location?: string | undefined;
    requiredSkills?: string[] | undefined;
    experienceLevel?: "junior" | "mid" | "senior" | undefined;
    budgetMin?: number | undefined;
    budgetMax?: number | undefined;
    jobType?: "contract" | "remote" | "onsite" | undefined;
}>;
export declare const updateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    requiredSkills: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    experienceLevel: z.ZodOptional<z.ZodOptional<z.ZodEnum<["junior", "mid", "senior"]>>>;
    budgetMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    budgetMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    rateType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["hourly", "monthly", "project"]>>>;
    jobType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["remote", "onsite", "contract"]>>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    rateType?: "hourly" | "monthly" | "project" | undefined;
    location?: string | undefined;
    title?: string | undefined;
    requiredSkills?: string[] | undefined;
    experienceLevel?: "junior" | "mid" | "senior" | undefined;
    budgetMin?: number | undefined;
    budgetMax?: number | undefined;
    jobType?: "contract" | "remote" | "onsite" | undefined;
}, {
    description?: string | undefined;
    rateType?: "hourly" | "monthly" | "project" | undefined;
    location?: string | undefined;
    title?: string | undefined;
    requiredSkills?: string[] | undefined;
    experienceLevel?: "junior" | "mid" | "senior" | undefined;
    budgetMin?: number | undefined;
    budgetMax?: number | undefined;
    jobType?: "contract" | "remote" | "onsite" | undefined;
}>;
