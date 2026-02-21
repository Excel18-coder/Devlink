import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

import { User } from "../models/User.js";
import { Developer } from "../models/Developer.js";
import { Employer } from "../models/Employer.js";
import { Job } from "../models/Job.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Create developer user
  const devUser = await User.create({ email: "amina@example.com", passwordHash, role: "developer", fullName: "Amina Osei" });
  await Developer.create({
    userId: devUser._id,
    bio: "Full-stack developer",
    skills: ["React", "Node.js", "MongoDB"],
    yearsExperience: 6,
    portfolioLinks: ["https://portfolio.example.com"],
    githubUrl: "https://github.com/amina",
    availability: "contract",
    rateType: "hourly",
    rateAmount: 45,
    location: "Accra, Ghana"
  });

  // Create employer user
  const empUser = await User.create({ email: "techcorp@example.com", passwordHash, role: "employer", fullName: "TechCorp Africa" });
  await Employer.create({ userId: empUser._id, companyName: "TechCorp Africa", website: "https://techcorp.example.com", about: "Remote-first product company", location: "Remote" });

  // Create job
  await Job.create({
    employerId: empUser._id,
    title: "Senior React Developer",
    description: "Build and scale frontend apps",
    requiredSkills: ["React", "TypeScript", "Node.js"],
    experienceLevel: "senior",
    budgetMin: 5000,
    budgetMax: 8000,
    rateType: "monthly",
    jobType: "remote",
    location: "Remote"
  });

  console.log("Seed data inserted");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
