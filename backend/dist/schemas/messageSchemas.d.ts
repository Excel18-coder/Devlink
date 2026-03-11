import { z } from "zod";
export declare const sendMessageSchema: z.ZodObject<{
    recipientId: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    recipientId: string;
    body: string;
}, {
    recipientId: string;
    body: string;
}>;
