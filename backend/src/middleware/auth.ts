import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens.js";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Support token in Authorization header OR query string (for SSE / EventSource)
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (typeof req.query.token === "string") {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const decoded = verifyAccessToken(token) as { id: string; role: string };
    req.user = { id: decoded.id, role: decoded.role };
    // Ensure auth-gated responses are never served from a shared cache
    res.setHeader("Cache-Control", "private, no-store");
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
