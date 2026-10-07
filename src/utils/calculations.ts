import { TempReading, Visit, Patient, FEVER_THRESHOLD_C, FEVER_THRESHOLD_F, STREAK_REQUIRED, MIN_SAMPLE_FOR_ALERT, MORTALITY_BENCHMARK } from '@/types';

/**
 * Format Date to YYYY-MM-DD for day comparisons
 */
export function toDateString(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date N days before a base date string
 */
export function getPreviousDateString(baseDateStr: string, daysAgo: number): string {
  const [year, month, day] = baseDateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - daysAgo);
  return toDateString(d);
}

/**
 * Get patient's readings for today
 */
export function getReadingsForToday(readings: TempReading[], patientId: string, todayStr: string = toDateString(new Date())): TempReading[] {
  return readings.filter(r => r.patientId === patientId && toDateString(r.recordedAt) === todayStr);
}

/**
 * Check if patient had temperature taken today
 */
export function isTempTakenToday(readings: TempReading[], patientId: string, todayStr: string = toDateString(new Date())): boolean {
  return getReadingsForToday(readings, patientId, todayStr).length > 0;
}

/**
 * Get patient's doctor visits for today
 */
export function getVisitsForToday(visits: Visit[], patientId: string, todayStr: string = toDateString(new Date())): Visit[] {
  return visits.filter(v => v.patientId === patientId && toDateString(v.visitedAt) === todayStr);
}

/**
 * Check if patient was visited by a doctor today
 */
export function isDoctorVisitedToday(visits: Visit[], patientId: string, todayStr: string = toDateString(new Date())): boolean {
  return getVisitsForToday(visits, patientId, todayStr).length > 0;
}

/**
 * Group readings by patient and date string (YYYY-MM-DD)
 */
export function getDailyReadingsMap(readings: TempReading[], patientId: string): Map<string, TempReading[]> {
  const map = new Map<string, TempReading[]>();
  const patientReadings = readings.filter(r => r.patientId === patientId);

  patientReadings.forEach(r => {
    const day = toDateString(r.recordedAt);
    if (!map.has(day)) {
      map.set(day, []);
    }
    map.get(day)!.push(r);
  });

  return map;
}

/**
 * Check if a specific calendar day was fever-free for a patient
 * (Must have at least 1 reading and ALL readings on that day < FEVER_THRESHOLD_C (38.0°C / 100.4°F))
 */
export function isDayFeverFree(dayReadings: TempReading[] | undefined): boolean {
  if (!dayReadings || dayReadings.length === 0) return false;
  return dayReadings.every(r => r.value < FEVER_THRESHOLD_C);
}

/**
 * Calculate fever-free streak count.
 */
export function getFeverFreeStreak(readings: TempReading[], patientId: string, todayStr: string = toDateString(new Date())): number {
  const dailyMap = getDailyReadingsMap(readings, patientId);
  const todayReadings = dailyMap.get(todayStr);

  let startDaysAgo = 0;

  if (todayReadings && todayReadings.length > 0) {
    startDaysAgo = 0;
  } else {
    startDaysAgo = 1;
  }

  let streak = 0;
  for (let i = startDaysAgo; i < 365; i++) {
    const checkDateStr = getPreviousDateString(todayStr, i);
    const dayReadings = dailyMap.get(checkDateStr);

    if (isDayFeverFree(dayReadings)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Check if patient is eligible for discharge (feverFreeStreak >= 3)
 */
export function isEligibleForDischarge(readings: TempReading[], patientId: string, todayStr: string = toDateString(new Date())): boolean {
  return getFeverFreeStreak(readings, patientId, todayStr) >= STREAK_REQUIRED;
}

/**
 * Check if a discharge-eligible patient is OVERDUE for doctor recommendation.
 */
export function isOverdueDischarge(patient: Patient, readings: TempReading[], visits: Visit[], todayStr: string = toDateString(new Date())): boolean {
  if (patient.status !== 'admitted' && patient.status !== 'discharge_recommended') return false;
  const streak = getFeverFreeStreak(readings, patient.id, todayStr);
  const isRecommended = patient.status === 'discharge_recommended' || visits.some(v => v.patientId === patient.id && v.decision === 'recommend_discharge');
  
  return streak >= 4 && !isRecommended;
}

/**
 * Temperature conversions
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function fahrenheitToCelsius(f: number): number {
  return Math.round((((f - 32) * 5) / 9) * 10) / 10;
}

/**
 * Format temperature in Fahrenheit (°F) as primary unit with optional °C
 */
export function formatTemperature(celsiusVal: number, primaryUnit: 'F' | 'C' = 'F'): string {
  if (primaryUnit === 'F') {
    const f = celsiusToFahrenheit(celsiusVal);
    return `${f}°F (${celsiusVal}°C)`;
  }
  return `${celsiusVal}°C (${celsiusToFahrenheit(celsiusVal)}°F)`;
}

export function formatTempShort(celsiusVal: number, primaryUnit: 'F' | 'C' = 'F'): string {
  if (primaryUnit === 'F') {
    const f = celsiusToFahrenheit(celsiusVal);
    return `${f}°F`;
  }
  return `${celsiusVal}°C`;
}

/**
 * Calculate length of stay in days
 */
export function getLengthOfStayDays(admittedAtISO: string, closedAtISO?: string): number {
  const start = new Date(admittedAtISO).getTime();
  const end = closedAtISO ? new Date(closedAtISO).getTime() : new Date().getTime();
  const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  return diffDays;
}

/**
 * Performance Dashboard Metrics
 */
export function calculateDashboardMetrics(patients: Patient[]) {
  const closedPatients = patients.filter(p => p.status === 'discharged' || p.status === 'deceased');
  const cured = closedPatients.filter(p => p.status === 'discharged').length;
  const deceased = closedPatients.filter(p => p.status === 'deceased').length;
  const totalClosed = cured + deceased;

  const mortalityRate = totalClosed > 0 ? deceased / totalClosed : 0;
  const cureRate = totalClosed > 0 ? cured / totalClosed : 0;
  const isMortalityAlert = totalClosed >= MIN_SAMPLE_FOR_ALERT && mortalityRate > MORTALITY_BENCHMARK;

  const avgLengthOfStay = closedPatients.length > 0
    ? Math.round(closedPatients.reduce((acc, p) => acc + getLengthOfStayDays(p.admittedAt, p.closedAt), 0) / closedPatients.length)
    : 0;

  const earlyDischarges = closedPatients.filter(p => p.dischargeOverrideReason).length;

  return {
    totalClosed,
    cured,
    deceased,
    mortalityRate,
    cureRate,
    isMortalityAlert,
    avgLengthOfStay,
    earlyDischarges,
  };
}
