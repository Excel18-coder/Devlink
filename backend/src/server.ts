import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.js";
import { AdminConfig } from "./models/AdminConfig.js";

import authRoutes from "./routes/authRoutes.js";
import developerRoutes from "./routes/developerRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

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
app.use(express.json());
app.use(morgan("dev"));

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Maintenance mode — checked from DB; admin routes are always exempt
app.use(async (req, res, next) => {
  try {
    if (req.path.startsWith("/api/admin") || req.path === "/api/health") return next();
    const cfg = await AdminConfig.findOne({ key: "maintenance_mode" });
    if (cfg && cfg.value === "true") {
      return res.status(503).json({ message: "Platform is under maintenance. Please try again later." });
    }
  } catch { /* DB error — allow through */ }
  return next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

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
