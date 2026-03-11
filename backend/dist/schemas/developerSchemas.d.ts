import { z } from "zod";
export declare const updateDeveloperSchema: z.ZodObject<{
    bio: z.ZodOptional<z.ZodString>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    yearsExperience: z.ZodOptional<z.ZodNumber>;
    portfolioLinks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    githubUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    availability: z.ZodOptional<z.ZodEnum<["full-time", "part-time", "contract"]>>;
    rateType: z.ZodOptional<z.ZodEnum<["hourly", "monthly", "project"]>>;
    rateAmount: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bio?: string | undefined;
    skills?: string[] | undefined;
    yearsExperience?: number | undefined;
    portfolioLinks?: string[] | undefined;
    githubUrl?: string | undefined;
    availability?: "full-time" | "part-time" | "contract" | undefined;
    rateType?: "hourly" | "monthly" | "project" | undefined;
    rateAmount?: number | undefined;
    location?: string | undefined;
}, {
    bio?: string | undefined;
    skills?: string[] | undefined;
    yearsExperience?: number | undefined;
    portfolioLinks?: string[] | undefined;
    githubUrl?: string | undefined;
    availability?: "full-time" | "part-time" | "contract" | undefined;
    rateType?: "hourly" | "monthly" | "project" | undefined;
    rateAmount?: number | undefined;
    location?: string | undefined;
}>;
