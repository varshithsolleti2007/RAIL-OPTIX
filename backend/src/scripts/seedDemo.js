// Seeds demo departments, railway sections, and one user per role so the
// CLAUDE_CODE_PROJECT_CONTEXT.md §50 demo scenario can be run end to end.
// Usage: node src/scripts/seedDemo.js
//
// For a richer set of requests/conflicts/schedules to click through
// manually, run `npm run seed:scenarios` afterwards instead of/as well
// as this one - it calls this same base data first.

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { ensureBaseData } from "./lib/baseData.js";

async function run() {
  await connectDB();
  await ensureBaseData();
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
