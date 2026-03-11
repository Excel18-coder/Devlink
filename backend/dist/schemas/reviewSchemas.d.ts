import { z } from "zod";
export declare const createReviewSchema: z.ZodObject<{
    contractId: z.ZodString;
    revieweeId: z.ZodString;
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contractId: string;
    revieweeId: string;
    rating: number;
    comment?: string | undefined;
}, {
    contractId: string;
    revieweeId: string;
    rating: number;
    comment?: string | undefined;
}>;
