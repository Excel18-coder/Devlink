import { z } from "zod";
export declare const createContractSchema: z.ZodObject<{
    jobId: z.ZodOptional<z.ZodString>;
    developerId: z.ZodString;
    milestones: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        amount: z.ZodNumber;
        dueDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        amount: number;
        dueDate?: string | undefined;
    }, {
        title: string;
        amount: number;
        dueDate?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    developerId: string;
    jobId?: string | undefined;
    milestones?: {
        title: string;
        amount: number;
        dueDate?: string | undefined;
    }[] | undefined;
}, {
    developerId: string;
    jobId?: string | undefined;
    milestones?: {
        title: string;
        amount: number;
        dueDate?: string | undefined;
    }[] | undefined;
}>;
