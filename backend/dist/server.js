import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.js";
import { AdminConfig } from "./models/AdminConfig.js";
import authRoutes from "./routes/authRoutes.js";
import proxyRoutes from "./routes/proxyRoutes.js";
import developerRoutes from "./routes/developerRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import showcaseRoutes from "./routes/showcaseRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
const app = express();
// Trust one layer of reverse-proxy (Render / Railway / Nginx) so that
// express-rate-limit reads the real client IP from X-Forwarded-For instead of
// the proxy's IP, and res.setHeader("X-Forwarded-Proto") works correctly.
app.set("trust proxy", 1);
// Middleware
app.use(helmet({
    // Strict CSP: no inline scripts, only same-origin + our API origin
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // PDF iframe needs this relaxed
    // Prevent MIME sniffing
    noSniff: true,
    // Force HTTPS for 1 year
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true },
    // Don't leak the backend framework
    hidePoweredBy: true,
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // allow non-browser requests
        const allowed = env.corsOrigin.split(",").map((o) => o.trim());
        const match = allowed.some((pattern) => {
            if (pattern === "*" || pattern === origin)
                return true;
            if (pattern.startsWith("https://*.")) {
                const suffix = pattern.slice("https://*.".length);
                return origin.startsWith("https://") && origin.endsWith(`.${suffix}`);
            }
            return false;
        });
        if (match)
            return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));
app.use(compression({ threshold: 1024 })); // skip compression for responses < 1 KB
app.use(express.json({ limit: "200kb" })); // tighter than 1 MB — no route needs more
app.use(morgan(env.nodeEnv === "production" ? "tiny" : "dev"));
// Health — registered before the rate limiter so it is always fast,
// never throttled, and never blocked by maintenance mode.
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
// Rate limiter — general: 200 req / 15 min per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please slow down." },
});
app.use(limiter);
// Auth rate limiter — stricter: 20 req / 15 min per IP (covers brute-force on login/OTP)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Please wait and try again." },
});
app.use("/api/auth", authLimiter);
// Maintenance mode — cached in-memory for 30 s to avoid hitting DB on every request
let _maintenanceCache = null;
const MAINTENANCE_TTL_MS = 30_000;
async function isMaintenanceMode() {
    const now = Date.now();
    if (_maintenanceCache && now - _maintenanceCache.cachedAt < MAINTENANCE_TTL_MS) {
        return _maintenanceCache.value;
    }
    try {
        const cfg = await AdminConfig.findOne({ key: "maintenance_mode" }).lean();
        const value = !!(cfg && cfg.value === "true");
        _maintenanceCache = { value, cachedAt: now };
        return value;
    }
    catch {
        return false; // DB error — allow through
    }
}
app.use(async (req, res, next) => {
    if (req.path.startsWith("/api/admin") || req.path === "/api/health")
        return next();
    if (await isMaintenanceMode()) {
        return res.status(503).json({ message: "Platform is under maintenance. Please try again later." });
    }
    return next();
});
// HTTP Caching — browsers and CDNs may reuse public GET responses for up to 60 s;
// requireAuth overrides this to "private, no-store" for any auth-gated route.
app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
    next();
});
// Routes
app.use("/api/proxy", proxyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/showcases", showcaseRoutes);
app.use("/api/news", newsRoutes);
// Error handler
app.use(errorHandler);
// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on port ${env.port}`);
    });
});
export default app;
