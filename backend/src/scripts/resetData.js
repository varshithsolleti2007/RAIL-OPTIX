// Wipes live application data (requests, conflicts, schedules,
// notifications, audit log, and the request-number counter) so seeding
// starts from a clean BR-0001 again. Leaves users/departments/sections
// untouched - re-run seed:demo/seed:scenarios afterwards.
//
// Usage: node src/scripts/resetData.js

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import BlockRequest from "../models/BlockRequest.js";
import Conflict from "../models/Conflict.js";
import Schedule from "../models/Schedule.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import Counter from "../models/Counter.js";

async function run() {
  await connectDB();

  const results = await Promise.all([
    BlockRequest.deleteMany({}),
    Conflict.deleteMany({}),
    Schedule.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  const [requests, conflicts, schedules, notifications, auditLogs, counters] = results;

  console.log(`Removed ${requests.deletedCount} block requests`);
  console.log(`Removed ${conflicts.deletedCount} conflicts`);
  console.log(`Removed ${schedules.deletedCount} schedules`);
  console.log(`Removed ${notifications.deletedCount} notifications`);
  console.log(`Removed ${auditLogs.deletedCount} audit log entries`);
  console.log(`Reset ${counters.deletedCount} counters`);

  await mongoose.disconnect();
  console.log("\nLive data cleared. Users/departments/sections were left alone.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
