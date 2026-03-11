import { ZodError } from "zod";
export const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        return next();
    }
    catch (err) {
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
