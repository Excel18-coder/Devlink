import { z } from "zod";
export declare const createShowcaseSchema: z.ZodObject<{
    title: z.ZodString;
    tagline: z.ZodString;
    description: z.ZodString;
    techStack: z.ZodArray<z.ZodString, "many">;
    projectUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    repoUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    category: z.ZodDefault<z.ZodEnum<["fintech", "agritech", "medtech", "biotech", "ecommerce", "climatetech", "engineering", "edtech", "proptech", "logistics", "ai", "web", "mobile", "other"]>>;
    lookingFor: z.ZodDefault<z.ZodEnum<["employers", "investors", "both"]>>;
    status: z.ZodDefault<z.ZodEnum<["active", "draft"]>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    status: "active" | "draft";
    title: string;
    tagline: string;
    techStack: string[];
    category: "other" | "fintech" | "agritech" | "medtech" | "biotech" | "ecommerce" | "climatetech" | "engineering" | "edtech" | "proptech" | "logistics" | "ai" | "web" | "mobile";
    lookingFor: "employers" | "investors" | "both";
    projectUrl?: string | undefined;
    repoUrl?: string | undefined;
}, {
    description: string;
    title: string;
    tagline: string;
    techStack: string[];
    status?: "active" | "draft" | undefined;
    projectUrl?: string | undefined;
    repoUrl?: string | undefined;
    category?: "other" | "fintech" | "agritech" | "medtech" | "biotech" | "ecommerce" | "climatetech" | "engineering" | "edtech" | "proptech" | "logistics" | "ai" | "web" | "mobile" | undefined;
    lookingFor?: "employers" | "investors" | "both" | undefined;
}>;
export declare const updateShowcaseSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    techStack: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    repoUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<["fintech", "agritech", "medtech", "biotech", "ecommerce", "climatetech", "engineering", "edtech", "proptech", "logistics", "ai", "web", "mobile", "other"]>>>;
    lookingFor: z.ZodOptional<z.ZodDefault<z.ZodEnum<["employers", "investors", "both"]>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "draft"]>>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    status?: "active" | "draft" | undefined;
    title?: string | undefined;
    tagline?: string | undefined;
    techStack?: string[] | undefined;
    projectUrl?: string | undefined;
    repoUrl?: string | undefined;
    category?: "other" | "fintech" | "agritech" | "medtech" | "biotech" | "ecommerce" | "climatetech" | "engineering" | "edtech" | "proptech" | "logistics" | "ai" | "web" | "mobile" | undefined;
    lookingFor?: "employers" | "investors" | "both" | undefined;
}, {
    description?: string | undefined;
    status?: "active" | "draft" | undefined;
    title?: string | undefined;
    tagline?: string | undefined;
    techStack?: string[] | undefined;
    projectUrl?: string | undefined;
    repoUrl?: string | undefined;
    category?: "other" | "fintech" | "agritech" | "medtech" | "biotech" | "ecommerce" | "climatetech" | "engineering" | "edtech" | "proptech" | "logistics" | "ai" | "web" | "mobile" | undefined;
    lookingFor?: "employers" | "investors" | "both" | undefined;
}>;
