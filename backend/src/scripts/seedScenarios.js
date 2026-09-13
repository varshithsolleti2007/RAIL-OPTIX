// Seeds a realistic spread of block requests - draft, conflicting,
// approved/scheduled, rejected, and failed-with-recovery - by calling
// the REAL running API (not writing Mongo documents directly), so every
// request/conflict/schedule/notification/audit-log entry is produced by
// the exact same code path a real user would trigger.
//
// Prerequisite: the backend must already be running (npm run dev / start)
// against the MongoDB in your .env, since this script talks to it over
// HTTP. If the ML service (ml/) is also running, the failed request at
// the end will come with a ready-made recovery recommendation; if not,
// it still seeds fine, just without that recommendation pre-filled.
//
// Usage: node src/scripts/seedScenarios.js

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { ensureBaseData, DEMO_PASSWORD } from "./lib/baseData.js";

const BACKEND_URL = process.env.SEED_BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const api = axios.create({ baseURL: `${BACKEND_URL}/api` });

const tokenCache = {};

async function login(email) {
  if (tokenCache[email]) return tokenCache[email];
  const { data } = await api.post("/auth/login", { email, password: DEMO_PASSWORD });
  tokenCache[email] = data.data.token;
  return tokenCache[email];
}

function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function createRequest(token, { sectionId, workType, description, date, startTime, endTime, priority }) {
  const { data } = await api.post(
    "/block-requests",
    { sectionId, workType, description, date, startTime, endTime, priority },
    auth(token)
  );
  return data.data.request;
}

async function submit(token, id) {
  const { data } = await api.post(`/block-requests/${id}/submit`, {}, auth(token));
  return data.data.request;
}

async function approve(controlToken, id) {
  const { data } = await api.post(`/block-requests/${id}/approve`, {}, auth(controlToken));
  return data.data.request;
}

async function reject(controlToken, id, reason) {
  const { data } = await api.post(`/block-requests/${id}/reject`, { reason }, auth(controlToken));
  return data.data.request;
}

async function fail(controlToken, id) {
  const { data } = await api.post(`/block-requests/${id}/fail`, {}, auth(controlToken));
  return data.data;
}

async function run() {
  console.log(`Connecting to MongoDB to ensure base data exists...`);
  await connectDB();
  const { sectionByName } = await ensureBaseData();
  await mongoose.disconnect();

  console.log(`\nSeeding scenarios via the live API at ${BACKEND_URL} ...`);

  const engToken = await login("engineering@rail.com");
  const eleToken = await login("electrical@rail.com");
  const sntToken = await login("snt@rail.com");
  const ctrlToken = await login("control@rail.com");

  const KAK_RJY = sectionByName["KAK-RJY"]._id.toString();
  const RJY_SLO = sectionByName["RJY-SLO"]._id.toString();

  // ---------------------------------------------------------------
  // 2026-09-20, KAK-RJY: an unresolved overlap - Engineering vs
  // Electrical, both HIGH priority. Left SUBMITTED on purpose so you
  // can practice conflict review + recommend + approve/modify yourself.
  // ---------------------------------------------------------------
  const engConflictReq = await createRequest(engToken, {
    sectionId: KAK_RJY,
    workType: "Track Maintenance",
    description: "Rail joint inspection and re-tightening.",
    date: "2026-09-20",
    startTime: "2026-09-20T10:00:00",
    endTime: "2026-09-20T13:00:00",
    priority: "HIGH",
  });
  await submit(engToken, engConflictReq._id);

  const eleConflictReq = await createRequest(eleToken, {
    sectionId: KAK_RJY,
    workType: "OHE Maintenance",
    description: "Overhead catenary tension adjustment.",
    date: "2026-09-20",
    startTime: "2026-09-20T11:30:00",
    endTime: "2026-09-20T14:00:00",
    priority: "HIGH",
  });
  await submit(eleToken, eleConflictReq._id);
  console.log(`Seeded conflicting pair: ${engConflictReq.requestNumber} vs ${eleConflictReq.requestNumber} (KAK-RJY, 2026-09-20) - left SUBMITTED, unresolved.`);

  // ---------------------------------------------------------------
  // 2026-09-21, RJY-SLO: one clean submission (no conflict - test the
  // simplest "approve as requested" path), plus one DRAFT (never
  // submitted - test edit + submit yourself).
  // ---------------------------------------------------------------
  const sntCleanReq = await createRequest(sntToken, {
    sectionId: RJY_SLO,
    workType: "Signal Maintenance",
    description: "Point machine lubrication and testing.",
    date: "2026-09-21",
    startTime: "2026-09-21T09:00:00",
    endTime: "2026-09-21T11:00:00",
    priority: "MEDIUM",
  });
  await submit(sntToken, sntCleanReq._id);
  console.log(`Seeded clean submission: ${sntCleanReq.requestNumber} (RJY-SLO, 2026-09-21) - SUBMITTED, no conflict.`);

  const engDraftReq = await createRequest(engToken, {
    sectionId: RJY_SLO,
    workType: "Track Inspection",
    description: "Routine quarterly track geometry inspection.",
    date: "2026-09-21",
    startTime: "2026-09-21T14:00:00",
    endTime: "2026-09-21T16:00:00",
    priority: "LOW",
  });
  console.log(`Seeded draft: ${engDraftReq.requestNumber} (RJY-SLO, 2026-09-21) - DRAFT, never submitted.`);

  // ---------------------------------------------------------------
  // 2026-09-22, KAK-RJY: two back-to-back approved/scheduled requests
  // - ready-made data for the Day Simulation panel.
  // ---------------------------------------------------------------
  const eleScheduledReq = await createRequest(eleToken, {
    sectionId: KAK_RJY,
    workType: "Electrical Inspection",
    description: "Traction substation feeder inspection.",
    date: "2026-09-22",
    startTime: "2026-09-22T08:00:00",
    endTime: "2026-09-22T10:00:00",
    priority: "MEDIUM",
  });
  await submit(eleToken, eleScheduledReq._id);
  await approve(ctrlToken, eleScheduledReq._id);

  const engScheduledReq = await createRequest(engToken, {
    sectionId: KAK_RJY,
    workType: "Civil Maintenance",
    description: "Bridge girder bearing inspection.",
    date: "2026-09-22",
    startTime: "2026-09-22T10:00:00",
    endTime: "2026-09-22T12:00:00",
    priority: "HIGH",
  });
  await submit(engToken, engScheduledReq._id);
  await approve(ctrlToken, engScheduledReq._id);
  console.log(`Seeded scheduled pair: ${eleScheduledReq.requestNumber} + ${engScheduledReq.requestNumber} (KAK-RJY, 2026-09-22) - both SCHEDULED, back-to-back.`);

  // ---------------------------------------------------------------
  // 2026-09-23, RJY-SLO: a rejected request, with a reason.
  // ---------------------------------------------------------------
  const sntRejectedReq = await createRequest(sntToken, {
    sectionId: RJY_SLO,
    workType: "Interlocking Work",
    description: "Route relay interlocking upgrade.",
    date: "2026-09-23",
    startTime: "2026-09-23T09:00:00",
    endTime: "2026-09-23T12:00:00",
    priority: "URGENT",
  });
  await submit(sntToken, sntRejectedReq._id);
  await reject(ctrlToken, sntRejectedReq._id, "Corridor already committed to a higher-priority possession that week. Please resubmit for 2026-09-30.");
  console.log(`Seeded rejected request: ${sntRejectedReq.requestNumber} (RJY-SLO, 2026-09-23) - REJECTED with reason.`);

  // ---------------------------------------------------------------
  // 2026-09-24, KAK-RJY: a request that was scheduled, then disrupted -
  // left FAILED with a recovery recommendation ready to review.
  // ---------------------------------------------------------------
  const engFailedReq = await createRequest(engToken, {
    sectionId: KAK_RJY,
    workType: "Track Maintenance",
    description: "Emergency rail crack repair.",
    date: "2026-09-24",
    startTime: "2026-09-24T07:00:00",
    endTime: "2026-09-24T10:00:00",
    priority: "HIGH",
  });
  await submit(engToken, engFailedReq._id);
  await approve(ctrlToken, engFailedReq._id);
  const failResult = await fail(ctrlToken, engFailedReq._id);
  console.log(
    `Seeded disrupted request: ${engFailedReq.requestNumber} (KAK-RJY, 2026-09-24) - FAILED, recovery recommendation ${failResult.recovery?.available ? "ready" : "unavailable (ML service was offline during seeding - click 'Get AI Recommendation' once it's running)"}.`
  );

  console.log(`\nDone. Log in as control@rail.com / ${DEMO_PASSWORD} to see the full queue.`);
}

run().catch((error) => {
  console.error("Seeding failed:", error.response?.data || error.message);
  process.exit(1);
});
