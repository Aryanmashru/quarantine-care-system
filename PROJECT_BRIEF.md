# Quarantine & Treatment Facility App — Prototype Build Brief

> Paste this file into Antigravity as the project brief. Build exactly what is described here. Do not add features beyond scope.

## 1. Goal

Build a deployable, working prototype (Next.js + Tailwind, statically exported and deployable on Cloudflare Pages) for a virus quarantine and treatment facility. It replaces paper temperature journals with a shared digital worklist so that:

- Every patient's temperature is measured **exactly once per day** (no misses, no duplicates).
- Doctors only visit patients **after** their temperature is recorded.
- Patients are **discharged promptly** once they have 3 consecutive fever-free days and the doctor signs off.
- Management can track **outcomes against the 85% cure / 15% mortality benchmark**.

### Domain facts
- Virus: 15% mortality, main symptom is prolonged fever.
- Cured = 3 full consecutive days without fever.
- Capacity: **74 beds**, currently full.
- Daily process: nurse measures temperature, then doctor visits the same day.

## 2. Tech and constraints

- Next.js (App Router) + TypeScript + Tailwind. Optional: shadcn/ui, Recharts for charts.
- **No backend needed.** Use a client-side store (Zustand or React context) persisted to `localStorage`, with a seed script and a "Reset demo data" button.
- Mobile-friendly (nurses use phones/tablets), clean and clinical visual style.
- **Deployment target: Cloudflare Pages (static export).** Set `output: 'export'` in `next.config` (and `images: { unoptimized: true }`). Do not use server components that need a runtime, API routes, middleware, or `next/image` optimization. The build output (`out/`) must work as plain static files with no environment variables.

## 3. Roles (v1)

Login screen has **three one-click demo personas** (no real auth): Nurse, Doctor, Admin. Include a persistent role switcher in the header.

| Capability | Nurse | Doctor | Admin |
|---|---|---|---|
| Record temperature | Yes | Yes (flagged "doctor-recorded") | No |
| View patient temp history/chart | Yes | Yes | Yes (read-only) |
| Log doctor visit + treatment notes | No | Yes | No |
| Recommend discharge | No | Yes | No |
| Record death | No | Yes | No |
| Admit patient + assign bed | No | No | Yes |
| Process discharge, free bed | No | No | Yes |
| Performance dashboard | No | View | Yes |
| Reset demo data | No | No | Yes |
| Add patient to waitlist | No | No | Yes |
| Flag waitlist entry as urgent | No | Yes | No |
| View closed cases (discharged/deceased) | No | Yes | Yes |
| View audit log | No | No | Yes |

## 4. Data model

```ts
type Role = 'nurse' | 'doctor' | 'admin';

type Patient = {
  id: string;
  name: string;
  age: number;
  bed: number;                 // 1..74, unique among admitted patients
  status: 'admitted' | 'discharge_recommended' | 'discharged' | 'deceased';
  admittedAt: string;          // ISO
  closedAt?: string;           // discharge or death time
  dischargeOverrideReason?: string;
};

type TempReading = {
  id: string;
  patientId: string;
  value: number;               // stored in °C
  recordedAt: string;          // ISO
  recordedBy: string;          // user name
  recordedByRole: Role;
  isRecheck: boolean;          // true if not the first reading of the day
  recheckReason?: string;
  isLateEntry: boolean;
};

type Visit = {
  id: string;
  patientId: string;
  doctor: string;
  visitedAt: string;
  notes: string;
  treatment: string;
  decision: 'continue' | 'recommend_discharge' | 'record_death';
};

type WaitlistEntry = { id: string; name: string; age: number; urgent: boolean; addedAt: string };

type AuditEntry = { id: string; at: string; actor: string; role: Role; action: string; patientId?: string; detail?: string };
```

**Derived per patient per day:**
- `tempTakenToday` = at least one reading today.
- `doctorVisitedToday` = at least one visit today.
- `feverFreeStreak` = count of consecutive calendar days, each with at least one reading and all readings below the fever threshold. Count backwards from today if today already has a reading, otherwise from yesterday (a pending reading today is NOT a break). A fever reading, or a past day with no reading, ends the streak.
- `eligibleForDischarge` = `feverFreeStreak >= 3`.

**Config constants:** `FEVER_THRESHOLD_C = 38.0`, `CAPACITY = 74`, `STREAK_REQUIRED = 3`, `MORTALITY_BENCHMARK = 0.15`, `MIN_SAMPLE_FOR_ALERT = 20`.

## 5. Seed data

Pre-seed on first load so every workflow is demonstrable immediately:
- 74 admitted patients with realistic names, beds 1 to 74.
- Temperature history of 1 to 10 days each, with varied states:
  - ~25 patients: temp **not yet taken today**.
  - ~20 patients: temp taken, **doctor not yet visited**.
  - ~15 patients: temp taken and doctor visited.
  - ~6 patients: streak at 2 (one more day to eligibility).
  - ~5 patients: streak at 3 or more, **eligible, awaiting doctor recommendation**.
  - ~3 patients: **already recommended** for discharge (visible in admin discharge queue).
  - 1 patient with a duplicate reading today.
  - 3 readings recorded within the last hour, so the edit flow is demonstrable.
- ~40 historical closed cases (discharged and deceased) so the dashboard has data. Make the mortality rate slightly above 15% overall so the alert state is demonstrable.
- A waitlist of 3 patients.

## 6. Screens

1. **Login / persona picker** — three cards: Nurse, Doctor, Admin. Include a collapsible **Demo guide** panel listing the 11 workflows in section 7 as a click-through checklist, so a reviewer can follow each one.
2. **Nurse worklist** — tabs: *Pending* / *Done today*. Search by name or bed. Each row: bed, name, last temp, fever badge, "Record" button. Header counter: "X of 74 recorded".
3. **Record temperature modal** — numeric input (°C, with optional °F toggle), validation, and conditional recheck-reason field.
4. **Patient detail** — header (name, bed, age, admitted date), temperature line chart with threshold line, fever-free streak indicator ("Day 2 of 3"), visit and treatment timeline, and role-appropriate action buttons. Readings recorded within the last hour show an **Edit** action (reason required, only for the person who recorded it).
5. **Doctor worklist** — tabs: *Ready to visit* (temp taken, not visited), *Awaiting temp*, *Visited today*, *Discharge-eligible* (highlighted, overdue items in red).
6. **Visit form** — notes, treatment, decision: Continue / Recommend discharge / Record death (confirmation dialog).
7. **Admin bed board** — grid of 74 beds colored by state: occupied, discharge recommended, free. Click a bed to view the patient.
8. **Admit patient and waitlist** — admit form with name, age, auto-assigned or chosen free bed. When full, the form is disabled and an **Add to waitlist** form plus the ordered waitlist is shown. Doctors see the waitlist read-only with an **Urgent** toggle; admins can admit from the waitlist into a free bed.
9. **Discharge queue** — patients with doctor sign-off, each with a "Process discharge" button.
10. **Performance dashboard** — KPI cards (occupancy, cured, deceased, mortality %, cure % vs 85% benchmark, avg length of stay), trend chart, and an alert banner when mortality exceeds 15%.
11. **Closed cases** — read-only list of discharged and deceased patients with outcome, length of stay, and any early-discharge override reason (Doctor and Admin).
12. **Audit log** — Admin-only chronological list of every state-changing action, filterable by patient or actor.

## 7. Required workflows (must work end-to-end)

1. **Nurse records temperature** → patient moves from *Pending* to *Done today* → appears in doctor's *Ready to visit*.
2. **Duplicate warning** → recording a second reading the same day shows who recorded the first and when, and requires a reason before saving.
3. **Fever alert** → reading at or above threshold shows a red alert and resets the streak.
4. **Streak reaches 3** → patient is flagged *Discharge-eligible* on the doctor's list.
5. **Doctor visit** → logs notes and treatment. If no temp exists today, show a warning with options to record it (flagged doctor-recorded) or skip.
6. **Doctor recommends discharge** → patient appears in admin's discharge queue.
7. **Admin processes discharge** → bed becomes free and patient becomes read-only.
8. **Admit from waitlist** → admin admits into the freed bed and the full-capacity state clears.
9. **Doctor records death** → patient closed, dashboard mortality updates, alert shows if over threshold and sample is large enough.
10. **Edit a recent reading** → within 1 hour, the recorder edits a value with a reason, the streak recalculates, and the change appears in the audit log.
11. **Waitlist priority** → admin adds a person to the waitlist, a doctor flags them urgent, and they move to the top of the queue.

## 8. Business rules and validation

### Temperature
- **Hard block** values below 34.0°C or above 43.0°C (likely typos).
- **Soft warning with confirm** for 34.0 to 35.0°C and 41.0 to 43.0°C.
- **Fever** = value at or above 38.0°C, shown with a red badge.
- **Duplicate same-day reading:** warn, not block. Require a reason and mark `isRecheck = true`.
- No future timestamps. Earlier-today entries allowed, flagged `isLateEntry`.
- Readings cannot be deleted. Edits allowed within 1 hour with a reason, and every edit is written to the audit log.

### Doctor visits
- Visit button is available for admitted patients only.
- If no temp today, show a warning banner "Temperature not recorded today".
- A second visit on the same day asks for confirmation.

### Discharge
- **Recommend discharge** is enabled only if `feverFreeStreak >= 3`.
- Early discharge: doctor override allowed with a mandatory reason, flagged in the dashboard.
- Admin can process discharge only if status is `discharge_recommended`.
- If a fever is recorded after a recommendation and before processing, **auto-withdraw** the recommendation and show a notice to doctor and admin.
- Overdue: if a patient became eligible and no recommendation exists by the end of the next day, show a red "Overdue" tag on the doctor list and in the admin view. **Never auto-discharge.**

### Admissions and capacity
- Max 74 admitted. At capacity, the Admit button is disabled with a message "Facility full — add to waitlist".
- One patient per bed. Prevent double assignment.
- Waitlist is first-come, first-served, with a doctor-set urgent flag that moves entries up.

### Outcomes and metrics
- `mortality = deaths / (deaths + cured discharges)`, closed cases only. Early-discharge overrides are listed separately.
- Show overall and rolling 30 days.
- Show the alert banner only if `closed cases >= 20` and mortality `> 15%`.

### Permissions
- Enforce by role in the UI: hide or disable actions the role cannot perform and show a tooltip explaining why.
- All state-changing actions write an `AuditEntry`.

## 9. Out of scope (v1)

Real authentication, billing, patient self-service, push notifications, external integrations, real backend.

## 10. Build order

1. Types, constants, seed script, store with localStorage persistence.
2. Shared components (patient row, badges, modal, chart).
3. Persona picker and role-based layout.
4. Nurse worklist and record-temperature flow (including duplicate and fever handling).
5. Patient detail with chart and streak.
6. Doctor worklist and visit form.
7. Admin bed board, admit, discharge queue.
8. Dashboard and mortality alert.
9. Reset-demo-data button, empty states, mobile polish.
10. Run `npm run build`, confirm `out/` is generated, then deploy to Cloudflare Pages (build command `npm run build`, output directory `out`).

## 11. Acceptance checklist

- [ ] Fresh load shows seeded data, with no setup required.
- [ ] All 11 workflows in section 7 work in sequence without errors.
- [ ] A patient with no reading yet today does not lose their streak until the day ends.
- [ ] Every validation and warning in section 8 triggers correctly.
- [ ] Role restrictions hide or disable the correct actions.
- [ ] Layout is usable on a 390px-wide phone screen.
- [ ] `npm run build` passes, generates `out/`, and the app works when deployed on Cloudflare Pages.
- [ ] Refreshing any route on the deployed site works (no 404s on direct URL loads).
- [ ] Reset button restores the original demo state.
