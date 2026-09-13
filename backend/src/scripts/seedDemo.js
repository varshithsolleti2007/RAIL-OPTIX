// Seeds demo departments, railway sections, and one user per role so the
// CLAUDE_CODE_PROJECT_CONTEXT.md §50 demo scenario can be run end to end.
// Usage: node src/scripts/seedDemo.js

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Department from "../models/Department.js";
import RailwaySection from "../models/RailwaySection.js";
import User from "../models/User.js";

const DEPARTMENTS = [
  { name: "Engineering", code: "ENGINEERING" },
  { name: "Electrical", code: "ELECTRICAL" },
  { name: "Signalling & Telecommunication", code: "SNT" },
];

const SECTIONS = [
  { name: "KAK-RJY", corridorId: "C1", description: "Kakinada to Rajahmundry" },
  { name: "RJY-SLO", corridorId: "C1", description: "Rajahmundry to Samalkot" },
];

const DEMO_USERS = [
  { name: "Engineering User", email: "engineering@rail.com", role: "engineering", departmentCode: "ENGINEERING" },
  { name: "Electrical User", email: "electrical@rail.com", role: "electrical", departmentCode: "ELECTRICAL" },
  { name: "S&T User", email: "snt@rail.com", role: "snt", departmentCode: "SNT" },
  { name: "Control Officer", email: "control@rail.com", role: "control" },
];

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "demopass123";

async function run() {
  await connectDB();

  const departmentByCode = {};

  for (const dept of DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate({ code: dept.code }, dept, { upsert: true, returnDocument: "after" });
    departmentByCode[dept.code] = doc;
    console.log(`Department ready: ${doc.name}`);
  }

  for (const section of SECTIONS) {
    await RailwaySection.findOneAndUpdate({ name: section.name }, section, { upsert: true, returnDocument: "after" });
    console.log(`Section ready: ${section.name}`);
  }

  for (const demoUser of DEMO_USERS) {
    const existing = await User.findOne({ email: demoUser.email });

    if (existing) {
      console.log(`User already exists: ${demoUser.email}`);
      continue;
    }

    const passwordHash = await User.hashPassword(DEMO_PASSWORD);

    await User.create({
      name: demoUser.name,
      email: demoUser.email,
      passwordHash,
      role: demoUser.role,
      department: demoUser.departmentCode ? departmentByCode[demoUser.departmentCode]._id : undefined,
    });

    console.log(`User created: ${demoUser.email} / ${DEMO_PASSWORD}`);
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
