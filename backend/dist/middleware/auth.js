import { verifyAccessToken } from "../utils/tokens.js";
export const requireAuth = (req, res, next) => {
    // Support token in Authorization header OR query string (for SSE / EventSource)
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
    }
    else if (typeof req.query.token === "string") {
        token = req.query.token;
    }
    if (!token) {
        return res.status(401).json({ message: "Missing token" });
    }
    try {
        const decoded = verifyAccessToken(token);
        req.user = { id: decoded.id, role: decoded.role };
        // Ensure auth-gated responses are never served from a shared cache
        res.setHeader("Cache-Control", "private, no-store");
        return next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
