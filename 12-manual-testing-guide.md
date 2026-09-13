# Manual Testing Guide

A step-by-step walkthrough for clicking through every feature yourself — requests, conflicts, AI recommendations, approvals, rejections, disruption/recovery, day simulation, notifications, and audit history.

---

## 1. Start everything

Three services, three terminals:

```bash
# Terminal 1 - Intelligence Service
cd ml
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173**. Make sure MongoDB is running (`mongodb://localhost:27017` per `backend/.env`).

---

## 2. Load the data

Run these once, in order, from `backend/`:

```bash
npm run seed:admin       # creates the Admin login
npm run seed:demo        # departments, sections, one user per department role
npm run seed:scenarios   # a realistic spread of requests in every state (see table below)
```

Want a totally clean slate at any point? `npm run db:reset` wipes all requests/conflicts/schedules/notifications/audit logs (keeps users/departments/sections), then re-run `seed:scenarios`.

### Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rail.com` | `adminadmin` |
| Control Officer | `control@rail.com` | `demopass123` |
| Engineering | `engineering@rail.com` | `demopass123` |
| Electrical | `electrical@rail.com` | `demopass123` |
| S&T | `snt@rail.com` | `demopass123` |

### What `seed:scenarios` already put in the system

| # | Section | Date | Department | Work Type | Priority | State | Why it's there |
|---|---|---|---|---|---|---|---|
| **BR-0001** | KAK-RJY | 09-20 | Engineering | Track Maintenance | HIGH | SUBMITTED | Overlaps BR-0002 → open conflict |
| **BR-0002** | KAK-RJY | 09-20 | Electrical | OHE Maintenance | HIGH | SUBMITTED | Overlaps BR-0001 → open conflict |
| **BR-0003** | RJY-SLO | 09-21 | S&T | Signal Maintenance | MEDIUM | SUBMITTED | Clean — no conflict, nothing to resolve first |
| **BR-0004** | RJY-SLO | 09-21 | Engineering | Track Inspection | LOW | DRAFT | Never submitted — yours to edit and submit |
| **BR-0005** | KAK-RJY | 09-22 | Electrical | Electrical Inspection | MEDIUM | SCHEDULED | Back-to-back with BR-0006 — for Day Simulation |
| **BR-0006** | KAK-RJY | 09-22 | Engineering | Civil Maintenance | HIGH | SCHEDULED | Back-to-back with BR-0005 |
| **BR-0007** | RJY-SLO | 09-23 | S&T | Interlocking Work | URGENT | REJECTED | Already rejected, with a reason — inspect only |
| **BR-0008** | KAK-RJY | 09-24 | Engineering | Track Maintenance | HIGH | FAILED | Already disrupted — a recovery recommendation is sitting there ready for you to approve |

Sections `SLO-DVD` and `DVD-VSKP` exist with zero history, for testing a fresh submission with no prior bookings at all.

---

## 3. Walkthrough

### A. Role dashboards look different per login
Log in as each of `engineering@rail.com`, `electrical@rail.com`, `snt@rail.com`. Each only ever sees **its own** requests — Engineering can't see BR-0002 (Electrical's), etc. Log in as `control@rail.com` and note it sees everything.

### B. File a brand-new request
As **Engineering**: click **+ Create Block Request** → section `SLO-DVD` (a section with no history) → any work type → pick a date/time → priority `MEDIUM` → submit. It appears instantly as `SUBMITTED` with a fresh request number.

### C. Submit the sitting draft
As **Engineering**: BR-0004 sits as `DRAFT` in the requests table with a **Submit** button next to it. Click it. The point to verify: while it was a `DRAFT`, it never appeared in the Control Officer's queue and triggered no conflict check — only submitting does that.

### D. Watch a conflict get caught automatically
Log in as **Control**. Open the **Conflicts** panel — you'll see BR-0001 vs BR-0002, `TIME_OVERLAP`, severity `MEDIUM` (severity only escalates to `HIGH` when either side is priority `URGENT`). Nobody had to click anything to create this — it fired the moment BR-0002 was submitted.

### E. Ask the Intelligence Service for a recommendation
Still as Control, find BR-0001 or BR-0002 in the **Request Queue** and click **Get AI Recommendation**. Within a second you'll see a real computed window with a conflict score, disruption score, confidence %, and a plain-language reason — not canned text. Try both requests separately and compare the windows each gets offered.

### F. Accept it, resolve the conflict, publish
Click **Accept Recommendation** on one of the two — status flips to `SCHEDULED`, a Schedule record is created, and the owning department gets a notification. Then get + accept a recommendation for the *other* one (it will now correctly avoid whichever slot just got taken). Go back to **Conflicts**, type a resolution note, and click **Mark resolved**.

### G. The simplest path — approve with no AI involved
BR-0003 has no conflict at all. As Control, click **Approve As Requested** directly, skipping the recommendation step entirely. This is the manual-scheduling fallback path — confirms the app doesn't force every approval through the ML service.

### H. Reject with a reason
Create one more request as any department, submit it, then as Control click **Reject**, type a reason, confirm. Compare it against BR-0007, which was seeded already-rejected — same code path, same UI treatment (status chip + reason shown to the department).

### I. Run a Day Simulation
As Control, scroll to **Day Simulation**. Pick section `KAK-RJY`, date `2026-09-22`, click **Run Simulation**. You'll see BR-0005 and BR-0006 both come back `Completed` with zero delay — because they're genuinely back-to-back with no gap. Then try date `2026-09-20` on the same section: you'll see the two still-`SUBMITTED` conflicting requests **don't** show up (the simulator only replays active/scheduled bookings, not unresolved submissions) — a good way to demonstrate that submitted-but-unapproved requests aren't yet part of the real schedule.

### J. Disruption → recovery, end to end
BR-0008 is already sitting `FAILED` with a recovery recommendation pre-generated. As Control, open it and click **Accept Recommendation** — watch it become `SCHEDULED` again on a different window. To see the *whole* disruption flow yourself rather than inspecting a pre-built one: approve any currently-`SUBMITTED` request first, then on the **Schedule Timeline** click **Simulate Failure** on it. It flips to `FAILED`, both the department and Control get a "recovery needed" notification, and a fresh recommendation appears immediately — same mechanism BR-0008 already demonstrates.

### K. Notifications
Log in as **Electrical** — you should see a notification for whatever action Control just took on an Electrical request (approval, rejection, recovery). Click **Mark read**.

### L. Audit trail
Log in as **Admin** (`admin@rail.com`). The **System Activity** panel lists every CREATE / SUBMIT / APPROVE / REJECT / FAIL / RESOLVE_CONFLICT with who did it and when. This is the same list Control can also reach via `GET /api/audit`.

### M. Admin user/department management
Still as Admin: the **Users** table lets you deactivate a user (try deactivating `snt@rail.com`, then attempt to log in as them — login should fail) and reactivate them again.

### N. Graceful ML failure (optional, more advanced)
Stop the `ml` service (Ctrl+C in its terminal). As Control, click **Get AI Recommendation** on any pending request — you'll get a clear "recommendation unavailable" response instead of a crash, and **Approve As Requested** still works. Restart the `ml` service and the recommendation button works again immediately — no backend restart needed.

---

## 4. Starting over

```bash
cd backend
npm run db:reset
npm run seed:scenarios
```

This regenerates the exact same BR-0001–BR-0008 spread above, so you can re-run this whole guide as many times as you like.
