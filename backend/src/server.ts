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

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
    const allowed = env.corsOrigin.split(",").map((o) => o.trim());
    const match = allowed.some((pattern) => {
      if (pattern === "*" || pattern === origin) return true;
      if (pattern.startsWith("https://*.")) {
        const suffix = pattern.slice("https://*.".length);
        return origin.startsWith("https://") && origin.endsWith(`.${suffix}`);
      }
      return false;
    });
    if (match) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(morgan("dev"));

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Maintenance mode — cached in-memory for 30 s to avoid hitting DB on every request
let _maintenanceCache: { value: boolean; cachedAt: number } | null = null;
const MAINTENANCE_TTL_MS = 30_000;
async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (_maintenanceCache && now - _maintenanceCache.cachedAt < MAINTENANCE_TTL_MS) {
    return _maintenanceCache.value;
  }
  try {
    const cfg = await AdminConfig.findOne({ key: "maintenance_mode" }).lean();
    const value = !!(cfg && (cfg as { value?: string }).value === "true");
    _maintenanceCache = { value, cachedAt: now };
    return value;
  } catch {
    return false; // DB error — allow through
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/admin") || req.path === "/api/health") return next();
  if (await isMaintenanceMode()) {
    return res.status(503).json({ message: "Platform is under maintenance. Please try again later." });
  }
  return next();
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

// Health
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

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
