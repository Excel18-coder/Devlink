import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";
export declare const requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
