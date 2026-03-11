import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
export declare const validate: <T>(schema: ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
