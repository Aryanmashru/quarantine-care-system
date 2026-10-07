import { Patient, TempReading, Visit, WaitlistEntry, AuditEntry } from '@/types';
import { toDateString, getPreviousDateString } from './calculations';

export function generateSeedData() {
  const now = new Date();
  const todayStr = toDateString(now);

  const FIRST_NAMES = [
    'Alexander', 'Beatrix', 'Charles', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
    'Ian', 'Julia', 'Kevin', 'Laura', 'Marcus', 'Nora', 'Oliver', 'Penelope', 'Quentin',
    'Rachel', 'Samuel', 'Theresa', 'Ulysses', 'Victoria', 'William', 'Xena', 'Yusuf', 'Zoe',
    'Arthur', 'Bianca', 'Caleb', 'Daphne', 'Ethan', 'Flora', 'Gabriel', 'Hazel', 'Isaac',
    'Jasmine', 'Liam', 'Maya', 'Nathan', 'Olivia', 'Peter', 'Rose', 'Sebastian', 'Tara',
    'Victor', 'Willa', 'Xavier', 'Yvette', 'Zachary', 'Amelia', 'Benjamin', 'Chloe', 'Daniel',
    'Elena', 'Felix', 'Grace', 'Henry', 'Isla', 'Jack', 'Kira', 'Leo', 'Mia', 'Noah',
    'Ophelia', 'Paul', 'Quinn', 'Ruby', 'Simon', 'Stella', 'Thomas', 'Uma', 'Vincent', 'Wyatt'
  ];

  const LAST_NAMES = [
    'Sterling', 'Vance', 'Mercer', 'Hawthorne', 'Sinclair', 'Blackwood', 'Montague',
    'Kensington', 'Ashford', 'Davenport', 'Ellison', 'Fitzgerald', 'Gallagher', 'Hayes',
    'Irving', 'Jenkins', 'Kingsley', 'Lancaster', 'Monroe', 'Navarro', 'O\'Connor', 'Prescott',
    'Quigley', 'Rothschild', 'Sutherland', 'Thornton', 'Underwood', 'Vann', 'Whitmore', 'Xavier',
    'Yates', 'Zimmerman', 'Bennett', 'Carlisle', 'Donovan', 'Emerson', 'Fletcher', 'Grayson'
  ];

  function getRandomName(index: number): string {
    const f = FIRST_NAMES[index % FIRST_NAMES.length];
    const l = LAST_NAMES[Math.floor(index * 1.3) % LAST_NAMES.length];
    return `${f} ${l}`;
  }

  const patients: Patient[] = [];
  const readings: TempReading[] = [];
  const visits: Visit[] = [];
  const auditLogs: AuditEntry[] = [];

  let readingIdCounter = 1000;
  let visitIdCounter = 2000;
  let auditIdCounter = 3000;

  function createReading(
    patientId: string,
    val: number,
    dateISO: string,
    recordedBy: string = 'Nurse Sarah',
    recordedByRole: 'nurse' | 'doctor' | 'admin' = 'nurse',
    isRecheck: boolean = false,
    recheckReason?: string,
    isLateEntry: boolean = false
  ): TempReading {
    const r: TempReading = {
      id: `TR-${readingIdCounter++}`,
      patientId,
      value: val,
      recordedAt: dateISO,
      recordedBy,
      recordedByRole,
      isRecheck,
      recheckReason,
      isLateEntry,
    };
    readings.push(r);
    return r;
  }

  function createVisit(
    patientId: string,
    doctor: string,
    visitedAtISO: string,
    notes: string,
    treatment: string,
    decision: 'continue' | 'recommend_discharge' | 'record_death'
  ): Visit {
    const v: Visit = {
      id: `VIS-${visitIdCounter++}`,
      patientId,
      doctor,
      visitedAt: visitedAtISO,
      notes,
      treatment,
      decision,
    };
    visits.push(v);
    return v;
  }

  function createAudit(actor: string, role: 'nurse' | 'doctor' | 'admin', action: string, patientId?: string, detail?: string, dateISO: string = new Date().toISOString()) {
    auditLogs.push({
      id: `AUD-${auditIdCounter++}`,
      at: dateISO,
      actor,
      role,
      action,
      patientId,
      detail,
    });
  }

  // --- SEED 74 ADMITTED PATIENTS ---
  // Distribution of Length of Stay:
  // - Beds 1..22 (~30%): 1 to 3 days
  // - Beds 23..52 (~40%): 4 to 7 days
  // - Beds 53..70 (~25%): 8 to 12 days
  // - Beds 71..74 (4 long-stay patients): 13 to 16 days

  for (let bed = 1; bed <= 74; bed++) {
    const pId = `PAT-${100 + bed}`;
    const name = getRandomName(bed);
    const age = 18 + ((bed * 7) % 65);

    let status: Patient['status'] = 'admitted';
    if (bed >= 72) {
      status = 'discharge_recommended';
    }

    let daysAdmittedAgo = 4;
    if (bed <= 22) {
      daysAdmittedAgo = 1 + (bed % 3); // 1 to 3 days (30%)
    } else if (bed <= 52) {
      daysAdmittedAgo = 4 + (bed % 4); // 4 to 7 days (40%)
    } else if (bed <= 70) {
      daysAdmittedAgo = 8 + (bed % 5); // 8 to 12 days (25%)
    } else {
      daysAdmittedAgo = 13 + (bed - 71); // 13, 14, 15, 16 days (Long-stay cohort)
    }

    const admittedAtISO = new Date(now.getTime() - daysAdmittedAgo * 86400000).toISOString();

    patients.push({
      id: pId,
      name,
      age,
      bed,
      status,
      admittedAt: admittedAtISO,
    });

    createAudit('Admin Helen', 'admin', 'Admitted Patient', pId, `Assigned to Bed ${bed}`, admittedAtISO);

    // Build historical temperature readings for past days (1 to daysAdmittedAgo)
    for (let dayAgo = daysAdmittedAgo; dayAgo >= 1; dayAgo--) {
      const dayDateStr = getPreviousDateString(todayStr, dayAgo);
      const readTime = new Date(`${dayDateStr}T08:30:00.000Z`).toISOString();

      let val = 36.8;

      if (bed <= 5) {
        // COHORT 1: Newly admitted (<3 days) with high fever (>100.4°F / 38.0°C)
        val = 38.4 + (bed % 3) * 0.3; // 38.4°C (101.1°F) to 39.0°C (102.2°F)
      } else if (bed >= 16 && bed <= 20) {
        // COHORT 2: Fluctuating temp over last 3-5 days
        if (dayAgo % 2 === 0) {
          val = 38.6; // FEVER SPIKE 101.5°F
        } else {
          val = 36.7;
        }
      } else if (bed >= 71) {
        // LONG-STAY PATIENTS (13-16 days): Clear fever relapses (fever, 2 clear days, fever again)
        if (dayAgo % 3 === 1) {
          val = 38.6; // Fever relapse!
        } else {
          val = 36.6; // Clear day
        }
      } else if (bed >= 67 && bed <= 70) {
        // Eligible / Overdue Cohorts: Streak >= 3 (normal for last 3-4 days)
        if (dayAgo > 4) val = 38.4;
        else val = 36.5 + (bed % 3) / 10;
      } else if (bed >= 61 && bed <= 66) {
        // Streak = 2 cohort (fever 3 days ago, normal last 2 days)
        if (dayAgo >= 3) val = 38.5;
        else val = 36.5 + (bed % 3) / 10;
      } else {
        // General admitted cohort: fevers recur every 2-3 days so streak never reaches 3 during stay
        if (dayAgo % 3 === 0 || (dayAgo + bed) % 3 === 0) {
          val = 38.1 + (bed % 4) * 0.2; // Fever spike: 38.1°C to 38.7°C
        } else {
          val = 36.6 + (bed % 3) / 10;
        }
      }

      createReading(pId, Math.round(val * 10) / 10, readTime, 'Nurse Sarah', 'nurse');

      if (dayAgo >= 1 && (bed >= 46 || dayAgo > 1)) {
        const visitTime = new Date(`${dayDateStr}T14:00:00.000Z`).toISOString();
        createVisit(pId, 'Dr. Robert Vance', visitTime, 'Patient resting, vital signs monitored.', 'Supportive hydration and antipyretics', 'continue');
      }
    }
  }

  // --- TODAY READINGS ---

  // Beds 1..5: Newly admitted (<3d) with active fever today!
  for (let bed = 1; bed <= 5; bed++) {
    const pId = `PAT-${100 + bed}`;
    const todayReadingTime = new Date(now.getTime() - (bed * 10 + 10) * 60000).toISOString();
    const tempVal = 38.5;
    createReading(pId, tempVal, todayReadingTime, 'Nurse Sarah', 'nurse');
    createAudit('Nurse Sarah', 'nurse', 'Recorded Temperature', pId, `Value: ${tempVal}°C (101.3°F FEVER)`);
  }

  // Beds 16..20: Fluctuating temp patients
  for (let bed = 16; bed <= 20; bed++) {
    const pId = `PAT-${100 + bed}`;
    const todayReadingTime = new Date(now.getTime() - (bed - 10) * 12 * 60000).toISOString();
    const tempVal = bed % 2 === 0 ? 38.7 : 36.8;
    createReading(pId, tempVal, todayReadingTime, 'Nurse Sarah', 'nurse');
  }

  // Beds 26..45: temp taken today, doctor not visited
  for (let bed = 26; bed <= 45; bed++) {
    const pId = `PAT-${100 + bed}`;
    const minutesAgo = (bed - 25) * 2; // Bed 26: 2m ago, Bed 27: 4m ago (within 1 hour for demo!)
    const todayReadingTime = new Date(now.getTime() - minutesAgo * 60000).toISOString();
    const tempVal = bed % 5 === 0 ? 38.3 : 36.7;
    createReading(pId, tempVal, todayReadingTime, 'Nurse Sarah', 'nurse');
  }

  // Beds 46..60: temp taken today AND doctor visited
  for (let bed = 46; bed <= 60; bed++) {
    const pId = `PAT-${100 + bed}`;
    const todayReadingTime = new Date(now.getTime() - (60 - bed) * 20 * 60000).toISOString();
    const tempVal = 36.6;
    createReading(pId, tempVal, todayReadingTime, 'Nurse Sarah', 'nurse');
    
    const visitTime = new Date(now.getTime() - (60 - bed) * 10 * 60000).toISOString();
    createVisit(pId, 'Dr. Robert Vance', visitTime, 'Daily clinical assessment complete. Patient condition stable.', 'Hydration therapy', 'continue');
  }

  // Beds 67..71: streak >= 3 eligible, awaiting doctor recommendation (Beds 67 & 68 are OVERDUE)
  for (let bed = 67; bed <= 71; bed++) {
    const pId = `PAT-${100 + bed}`;
    const todayReadingTime = new Date(now.getTime() - 2 * 3600000).toISOString();
    createReading(pId, 36.5, todayReadingTime, 'Nurse Sarah', 'nurse');
  }

  // Beds 72..74: already recommended for discharge (in admin queue)
  for (let bed = 72; bed <= 74; bed++) {
    const pId = `PAT-${100 + bed}`;
    const todayReadingTime = new Date(now.getTime() - 3 * 3600000).toISOString();
    createReading(pId, 36.4, todayReadingTime, 'Nurse Sarah', 'nurse');
    
    const visitTime = new Date(now.getTime() - 1 * 3600000).toISOString();
    createVisit(pId, 'Dr. Aris Thorne', visitTime, 'Patient has 3 consecutive fever-free days. Fully recovered.', 'Discharge planning', 'recommend_discharge');
  }

  // 1 Duplicate reading today (Bed 26)
  const p26Id = `PAT-${100 + 26}`;
  createReading(p26Id, 36.8, new Date(now.getTime() - 5 * 60000).toISOString(), 'Nurse Alex', 'nurse', true, 'Patient felt warm, requested recheck');

  // --- CLOSED CASES (40 total, >15% mortality rate = 7 deaths out of 40 = 17.5%) ---
  for (let i = 1; i <= 40; i++) {
    const cId = `PAT-CLOSED-${200 + i}`;
    const name = getRandomName(i + 100);
    const age = 20 + ((i * 9) % 62);

    // 7 deaths out of 40 = 17.5% mortality (> 15% threshold!)
    const isDeceased = i === 5 || i === 11 || i === 18 || i === 24 || i === 29 || i === 35 || i === 40;
    const status: Patient['status'] = isDeceased ? 'deceased' : 'discharged';

    const daysAgoAdmitted = 4 + (i % 15); // 4 to 18 days length of stay
    const daysAgoClosed = 1 + (i % 5);

    const admittedAtISO = new Date(now.getTime() - daysAgoAdmitted * 86400000).toISOString();
    const closedAtISO = new Date(now.getTime() - daysAgoClosed * 86400000).toISOString();

    const overrideReason = !isDeceased && i % 7 === 0 ? 'Emergency transfer requested by specialist team' : undefined;

    patients.push({
      id: cId,
      name,
      age,
      bed: 0,
      status,
      admittedAt: admittedAtISO,
      closedAt: closedAtISO,
      dischargeOverrideReason: overrideReason,
    });
  }

  // --- WAITLIST (3 entries) ---
  const waitlist: WaitlistEntry[] = [
    {
      id: 'WAIT-1',
      name: 'Eleanor Vance',
      age: 68,
      urgent: true,
      addedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
    },
    {
      id: 'WAIT-2',
      name: 'Gideon Sterling',
      age: 45,
      urgent: false,
      addedAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
    },
    {
      id: 'WAIT-3',
      name: 'Clara Oswald',
      age: 29,
      urgent: false,
      addedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
    },
  ];

  return {
    patients,
    readings,
    visits,
    waitlist,
    auditLogs,
  };
}
