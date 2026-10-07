import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patient, TempReading, Visit, WaitlistEntry, AuditEntry, Role, FEVER_THRESHOLD_C, CAPACITY } from '@/types';
import { generateSeedData } from '@/utils/seedData';
import { isTempTakenToday, toDateString } from '@/utils/calculations';

export interface FacilityState {
  // Persona & UI State
  activeRole: Role;
  activeView: string;
  selectedPatientId: string | null;
  autoWithdrawNotice: { patientId: string; patientName: string; bed: number } | null;

  // Domain Entities
  patients: Patient[];
  readings: TempReading[];
  visits: Visit[];
  waitlist: WaitlistEntry[];
  auditLogs: AuditEntry[];

  // Actions
  setActiveRole: (role: Role) => void;
  setActiveView: (view: string) => void;
  setSelectedPatientId: (patientId: string | null) => void;
  clearAutoWithdrawNotice: () => void;

  // Domain Actions
  recordTemperature: (patientId: string, value: number, recheckReason?: string, isLateEntry?: boolean) => { success: boolean; error?: string };
  editRecentTemperature: (readingId: string, newValue: number, editReason: string) => { success: boolean; error?: string };
  recordVisit: (patientId: string, doctorName: string, notes: string, treatment: string, decision: Visit['decision'], overrideReason?: string) => { success: boolean; error?: string };
  processDischarge: (patientId: string) => { success: boolean; error?: string };
  recordDeath: (patientId: string, doctorName: string, notes: string) => { success: boolean; error?: string };
  admitPatient: (name: string, age: number, bed: number) => { success: boolean; error?: string };
  addToWaitlist: (name: string, age: number) => { success: boolean; error?: string };
  toggleWaitlistUrgent: (waitlistId: string) => void;
  admitFromWaitlist: (waitlistId: string, bed: number) => { success: boolean; error?: string };
  resetDemoData: () => void;
}

export const useFacilityStore = create<FacilityState>()(
  persist(
    (set, get) => ({
      activeRole: 'nurse',
      activeView: 'worklist',
      selectedPatientId: null,
      autoWithdrawNotice: null,

      ...generateSeedData(),

      setActiveRole: (activeRole: Role) => set({ activeRole }),
      setActiveView: (activeView: string) => set({ activeView }),
      setSelectedPatientId: (selectedPatientId: string | null) => set({ selectedPatientId }),
      clearAutoWithdrawNotice: () => set({ autoWithdrawNotice: null }),

      // 1. RECORD TEMPERATURE
      recordTemperature: (patientId, value, recheckReason, isLateEntry = false) => {
        const state = get();
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient || patient.status !== 'admitted' && patient.status !== 'discharge_recommended') {
          return { success: false, error: 'Patient not currently admitted.' };
        }

        const todayStr = toDateString(new Date());
        const hasTakenToday = isTempTakenToday(state.readings, patientId, todayStr);

        if (hasTakenToday && !recheckReason) {
          return { success: false, error: 'Duplicate reading today requires a recheck reason.' };
        }

        const actorName = state.activeRole === 'nurse' ? 'Nurse Sarah' : state.activeRole === 'doctor' ? 'Dr. Vance (Doctor)' : 'Admin';
        const nowISO = new Date().toISOString();

        const newReading: TempReading = {
          id: `TR-${Date.now()}`,
          patientId,
          value,
          recordedAt: nowISO,
          recordedBy: actorName,
          recordedByRole: state.activeRole,
          isRecheck: hasTakenToday,
          recheckReason: hasTakenToday ? recheckReason : undefined,
          isLateEntry,
        };

        const updatedReadings = [newReading, ...state.readings];

        // Auto-withdraw discharge recommendation if fever recorded
        let updatedPatients = [...state.patients];
        let autoWithdrawNotice = state.autoWithdrawNotice;

        if (value >= FEVER_THRESHOLD_C && patient.status === 'discharge_recommended') {
          updatedPatients = updatedPatients.map(p => p.id === patientId ? { ...p, status: 'admitted' as const } : p);
          autoWithdrawNotice = {
            patientId,
            patientName: patient.name,
            bed: patient.bed,
          };
        }

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: nowISO,
          actor: actorName,
          role: state.activeRole,
          action: 'Record Temperature',
          patientId,
          detail: `${value}°C ${value >= FEVER_THRESHOLD_C ? '(FEVER)' : ''} ${hasTakenToday ? '[Recheck]' : ''}`,
        };

        set({
          readings: updatedReadings,
          patients: updatedPatients,
          autoWithdrawNotice,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return { success: true };
      },

      // 2. EDIT RECENT READING (<1 hr)
      editRecentTemperature: (readingId, newValue, editReason) => {
        const state = get();
        const reading = state.readings.find(r => r.id === readingId);
        if (!reading) return { success: false, error: 'Reading not found.' };

        const ageMs = Date.now() - new Date(reading.recordedAt).getTime();
        if (ageMs > 3600000) {
          return { success: false, error: 'Readings older than 1 hour cannot be edited.' };
        }

        const nowISO = new Date().toISOString();
        const actorName = state.activeRole === 'nurse' ? 'Nurse Sarah' : 'Dr. Vance';

        const updatedReadings = state.readings.map(r => {
          if (r.id === readingId) {
            return {
              ...r,
              value: newValue,
              editedAt: nowISO,
              editReason,
            };
          }
          return r;
        });

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: nowISO,
          actor: actorName,
          role: state.activeRole,
          action: 'Edit Temperature Reading',
          patientId: reading.patientId,
          detail: `Changed from ${reading.value}°C to ${newValue}°C. Reason: ${editReason}`,
        };

        set({
          readings: updatedReadings,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return { success: true };
      },

      // 3. RECORD VISIT & DECISION
      recordVisit: (patientId, doctorName, notes, treatment, decision, overrideReason) => {
        const state = get();
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient || (patient.status !== 'admitted' && patient.status !== 'discharge_recommended')) {
          return { success: false, error: 'Patient is not currently admitted.' };
        }

        const nowISO = new Date().toISOString();

        const newVisit: Visit = {
          id: `VIS-${Date.now()}`,
          patientId,
          doctor: doctorName,
          visitedAt: nowISO,
          notes,
          treatment,
          decision,
        };

        let updatedPatients = [...state.patients];

        if (decision === 'recommend_discharge') {
          updatedPatients = updatedPatients.map(p =>
            p.id === patientId
              ? { ...p, status: 'discharge_recommended' as const, dischargeOverrideReason: overrideReason }
              : p
          );
        } else if (decision === 'record_death') {
          updatedPatients = updatedPatients.map(p =>
            p.id === patientId
              ? { ...p, status: 'deceased' as const, closedAt: nowISO, bed: 0 }
              : p
          );
        }

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: nowISO,
          actor: doctorName,
          role: 'doctor',
          action: `Doctor Visit (${decision.replace('_', ' ')})`,
          patientId,
          detail: `Notes: ${notes} | Decision: ${decision}${overrideReason ? ` | Override Reason: ${overrideReason}` : ''}`,
        };

        set({
          visits: [newVisit, ...state.visits],
          patients: updatedPatients,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return { success: true };
      },

      // 4. PROCESS DISCHARGE (Admin)
      processDischarge: (patientId) => {
        const state = get();
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient || patient.status !== 'discharge_recommended') {
          return { success: false, error: 'Patient is not currently recommended for discharge.' };
        }

        const nowISO = new Date().toISOString();
        const actorName = 'Admin Helen';

        const updatedPatients = state.patients.map(p =>
          p.id === patientId
            ? { ...p, status: 'discharged' as const, closedAt: nowISO, bed: 0 }
            : p
        );

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: nowISO,
          actor: actorName,
          role: 'admin',
          action: 'Processed Discharge',
          patientId,
          detail: `Patient discharged from Bed ${patient.bed}. Bed is now free.`,
        };

        set({
          patients: updatedPatients,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return { success: true };
      },

      // 5. RECORD DEATH (Doctor shortcut)
      recordDeath: (patientId, doctorName, notes) => {
        return get().recordVisit(patientId, doctorName, notes, 'Palliative care', 'record_death');
      },

      // 6. ADMIT PATIENT
      admitPatient: (name, age, bed) => {
        const state = get();
        const admittedCount = state.patients.filter(p => p.status === 'admitted' || p.status === 'discharge_recommended').length;
        if (admittedCount >= CAPACITY) {
          return { success: false, error: 'Facility at full capacity (74 beds occupied). Please add to waitlist.' };
        }

        const isBedOccupied = state.patients.some(p => (p.status === 'admitted' || p.status === 'discharge_recommended') && p.bed === bed);
        if (isBedOccupied) {
          return { success: false, error: `Bed ${bed} is already occupied.` };
        }

        const nowISO = new Date().toISOString();
        const pId = `PAT-${Date.now()}`;

        const newPatient: Patient = {
          id: pId,
          name,
          age,
          bed,
          status: 'admitted',
          admittedAt: nowISO,
        };

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: nowISO,
          actor: 'Admin Helen',
          role: 'admin',
          action: 'Admitted Patient',
          patientId: pId,
          detail: `Admitted ${name} (${age}y) to Bed ${bed}`,
        };

        set({
          patients: [newPatient, ...state.patients],
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return { success: true };
      },

      // 7. ADD TO WAITLIST
      addToWaitlist: (name, age) => {
        const state = get();
        const nowISO = new Date().toISOString();
        const wId = `WAIT-${Date.now()}`;

        const newEntry: WaitlistEntry = {
          id: wId,
          name,
          age,
          urgent: false,
          addedAt: nowISO,
        };

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: nowISO,
          actor: state.activeRole === 'admin' ? 'Admin Helen' : 'Dr. Vance',
          role: state.activeRole,
          action: 'Added to Waitlist',
          detail: `${name} (${age}y)`,
        };

        set({
          waitlist: [...state.waitlist, newEntry],
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return { success: true };
      },

      // 8. TOGGLE WAITLIST URGENT (Doctor)
      toggleWaitlistUrgent: (waitlistId) => {
        const state = get();
        const target = state.waitlist.find(w => w.id === waitlistId);
        if (!target) return;

        const updatedWaitlist = state.waitlist.map(w =>
          w.id === waitlistId ? { ...w, urgent: !w.urgent } : w
        ).sort((a, b) => {
          if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        });

        const newAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          at: new Date().toISOString(),
          actor: 'Dr. Vance',
          role: 'doctor',
          action: 'Updated Waitlist Urgency',
          detail: `Flagged ${target.name} as ${!target.urgent ? 'URGENT' : 'Normal'} priority`,
        };

        set({
          waitlist: updatedWaitlist,
          auditLogs: [newAudit, ...state.auditLogs],
        });
      },

      // 9. ADMIT FROM WAITLIST (Admin)
      admitFromWaitlist: (waitlistId, bed) => {
        const state = get();
        const entry = state.waitlist.find(w => w.id === waitlistId);
        if (!entry) return { success: false, error: 'Waitlist entry not found.' };

        const admitResult = state.admitPatient(entry.name, entry.age, bed);
        if (!admitResult.success) return admitResult;

        const updatedWaitlist = state.waitlist.filter(w => w.id !== waitlistId);

        set({ waitlist: updatedWaitlist });
        return { success: true };
      },

      // 10. RESET DEMO DATA
      resetDemoData: () => {
        set({
          activeRole: 'nurse',
          activeView: 'worklist',
          selectedPatientId: null,
          autoWithdrawNotice: null,
          ...generateSeedData(),
        });
      },
    }),
    {
      name: 'factwise_quarantine_facility_v1',
    }
  )
);
