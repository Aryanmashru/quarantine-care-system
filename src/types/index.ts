export type Role = 'nurse' | 'doctor' | 'admin';

export type PatientStatus = 'admitted' | 'discharge_recommended' | 'discharged' | 'deceased';

export type Patient = {
  id: string;
  name: string;
  age: number;
  bed: number;                 // 1..74, unique among admitted patients
  status: PatientStatus;
  admittedAt: string;          // ISO
  closedAt?: string;           // discharge or death time
  dischargeOverrideReason?: string;
};

export type TempReading = {
  id: string;
  patientId: string;
  value: number;               // stored in °C internally
  recordedAt: string;          // ISO
  recordedBy: string;          // user name
  recordedByRole: Role;
  isRecheck: boolean;          // true if not first reading of day
  recheckReason?: string;
  isLateEntry: boolean;
  editedAt?: string;
  editReason?: string;
};

export type VisitDecision = 'continue' | 'recommend_discharge' | 'record_death';

export type Visit = {
  id: string;
  patientId: string;
  doctor: string;
  visitedAt: string;
  notes: string;
  treatment: string;
  decision: VisitDecision;
};

export type WaitlistEntry = {
  id: string;
  name: string;
  age: number;
  urgent: boolean;
  addedAt: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  patientId?: string;
  detail?: string;
};

export const FEVER_THRESHOLD_C = 38.0;
export const FEVER_THRESHOLD_F = 100.4;
export const CAPACITY = 74;
export const STREAK_REQUIRED = 3;
export const MORTALITY_BENCHMARK = 0.15;
export const MIN_SAMPLE_FOR_ALERT = 20;

export type WorkflowStep = {
  id: number;
  title: string;
  description: string;
  roleHint: Role;
  targetView: string;
};
