// Shared base reference data (departments/sections/users) used by both
// seedDemo.js and seedScenarios.js, so the two seed scripts can't drift
// out of sync with each other.

import Department from "../../models/Department.js";
import RailwaySection from "../../models/RailwaySection.js";
import User from "../../models/User.js";

export const DEPARTMENTS = [
  { name: "Engineering", code: "ENGINEERING" },
  { name: "Electrical", code: "ELECTRICAL" },
  { name: "Signalling & Telecommunication", code: "SNT" },
];

// Real consecutive stretches on the Howrah-Chennai main line through
// coastal Andhra Pradesh. Only KAK-RJY and RJY-SLO get seeded requests
// (see seedScenarios.js) - the other two are here so there's always a
// clean section with zero history to test the "no conflict" path on.
export const SECTIONS = [
  { name: "KAK-RJY", corridorId: "C1", description: "Kakinada Town to Rajahmundry" },
  { name: "RJY-SLO", corridorId: "C1", description: "Rajahmundry to Samalkot" },
  { name: "SLO-DVD", corridorId: "C1", description: "Samalkot to Duvvada" },
  { name: "DVD-VSKP", corridorId: "C1", description: "Duvvada to Visakhapatnam" },
];

export const DEMO_USERS = [
  { name: "Engineering User", email: "engineering@rail.com", role: "engineering", departmentCode: "ENGINEERING" },
  { name: "Electrical User", email: "electrical@rail.com", role: "electrical", departmentCode: "ELECTRICAL" },
  { name: "S&T User", email: "snt@rail.com", role: "snt", departmentCode: "SNT" },
  { name: "Control Officer", email: "control@rail.com", role: "control" },
];

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "demopass123";

// Assumes mongoose is already connected. Idempotent - safe to call from
// both seed scripts every run.
export async function ensureBaseData() {
  const departmentByCode = {};

  for (const dept of DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate({ code: dept.code }, dept, { upsert: true, returnDocument: "after" });
    departmentByCode[dept.code] = doc;
    console.log(`Department ready: ${doc.name}`);
  }

  const sectionByName = {};

  for (const section of SECTIONS) {
    const doc = await RailwaySection.findOneAndUpdate({ name: section.name }, section, {
      upsert: true,
      returnDocument: "after",
    });
    sectionByName[section.name] = doc;
    console.log(`Section ready: ${section.name}`);
  }

  const userByEmail = {};

  for (const demoUser of DEMO_USERS) {
    let user = await User.findOne({ email: demoUser.email });

    if (!user) {
      const passwordHash = await User.hashPassword(DEMO_PASSWORD);
      user = await User.create({
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
        department: demoUser.departmentCode ? departmentByCode[demoUser.departmentCode]._id : undefined,
      });
      console.log(`User created: ${demoUser.email} / ${DEMO_PASSWORD}`);
    } else {
      console.log(`User already exists: ${demoUser.email}`);
    }

    userByEmail[demoUser.email] = user;
  }

  return { departmentByCode, sectionByName, userByEmail };
}
