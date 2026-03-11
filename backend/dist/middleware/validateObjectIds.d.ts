import { Request, Response, NextFunction } from "express";
/**
 * Express middleware that validates every named route parameter whose name ends
 * in "Id" or equals "id" is a valid MongoDB ObjectId.
 * Returns 400 immediately if any fails, preventing Mongoose from throwing a
 * CastError deep in a handler (which would bubble as a 500).
 *
 * Mount it per-router:
 *   router.use(validateObjectIds);
 */
export declare const validateObjectIds: (req: Request, res: Response, next: NextFunction) => void;
