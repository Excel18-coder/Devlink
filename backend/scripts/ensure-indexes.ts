/**
 * ensure-indexes.ts
 *
 * Run this once against a production MongoDB cluster to build all
 * Mongoose-declared indexes without restarting the app server:
 *
 *   npx tsx scripts/ensure-indexes.ts
 *
 * Safe to re-run — Mongoose skips indexes that already exist.
 */

import mongoose from "mongoose";
import { env } from "../src/config/env.js";

// Import every model so Mongoose registers their schemas + indexes
import "../src/models/User.js";
import "../src/models/Developer.js";
import "../src/models/Employer.js";
import "../src/models/Job.js";
import "../src/models/Application.js";
import "../src/models/Contract.js";
import "../src/models/Conversation.js";
import "../src/models/Message.js";
import "../src/models/Review.js";
import "../src/models/Showcase.js";
import "../src/models/AuditLog.js";
import "../src/models/RefreshToken.js";
import "../src/models/AdminConfig.js";
import "../src/models/EmailVerification.js";

async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10_000 });
  console.log("Connected. Building indexes…");

  const models = Object.values(mongoose.models);
  for (const model of models) {
    process.stdout.write(`  ${model.modelName}… `);
    await model.createIndexes();
    console.log("done");
  }

  console.log(`\nAll indexes ensured for ${models.length} model(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
