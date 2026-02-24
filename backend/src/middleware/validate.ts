import { ZodError, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.errors[0];
        const field = firstError?.path?.join(".") || "field";
        const message = firstError?.message
          ? `${field !== "field" ? field.charAt(0).toUpperCase() + field.slice(1) + ": " : ""}${firstError.message}`
          : "Validation failed";
        return res.status(400).json({ message, errors: err.errors });
      }
      return next(err);
    }
  };
