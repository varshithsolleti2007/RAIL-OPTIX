// One-time bootstrap: creates the first Admin user so someone can log in
// and provision everyone else via POST /api/auth/register.
//
// Usage: node src/scripts/seedAdmin.js
// Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME from .env.

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

async function run() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "System Admin";

  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env before seeding.");
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
  } else {
    const passwordHash = await User.hashPassword(password);
    await User.create({ name, email: email.toLowerCase(), passwordHash, role: "admin" });
    console.log(`Admin user created: ${email}`);
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
