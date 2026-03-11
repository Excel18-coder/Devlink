import { z } from "zod";
export declare const createNewsSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    excerpt: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    category: z.ZodDefault<z.ZodEnum<["jobs", "platform", "announcement", "industry", "general"]>>;
    imageUrl: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published"]>>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "published";
    title: string;
    body: string;
    category: "jobs" | "platform" | "announcement" | "industry" | "general";
    excerpt: string;
    imageUrl?: string | undefined;
}, {
    title: string;
    body: string;
    status?: "draft" | "published" | undefined;
    imageUrl?: string | undefined;
    category?: "jobs" | "platform" | "announcement" | "industry" | "general" | undefined;
    excerpt?: string | undefined;
}>;
export declare const updateNewsSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<["jobs", "platform", "announcement", "industry", "general"]>>>;
    imageUrl: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["draft", "published"]>>>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "published" | undefined;
    title?: string | undefined;
    body?: string | undefined;
    imageUrl?: string | undefined;
    category?: "jobs" | "platform" | "announcement" | "industry" | "general" | undefined;
    excerpt?: string | undefined;
}, {
    status?: "draft" | "published" | undefined;
    title?: string | undefined;
    body?: string | undefined;
    imageUrl?: string | undefined;
    category?: "jobs" | "platform" | "announcement" | "industry" | "general" | undefined;
    excerpt?: string | undefined;
}>;
