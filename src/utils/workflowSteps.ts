import { Role } from '@/types';

export interface DemoStep {
  id: number;
  title: string;
  description: string;
  role: Role;
  view: string;
  instructions: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: 'Nurse Records Temperature',
    description: 'Record temp for a pending patient; patient moves to Done Today and doctor\'s Ready to Visit queue.',
    role: 'nurse',
    view: 'worklist',
    instructions: 'As Nurse, find a patient in "Pending Temp Today" (e.g. Bed 1) and click "Record Temp". Enter 36.5°C and save.',
  },
  {
    id: 2,
    title: 'Duplicate Reading Warning',
    description: 'Attempting a 2nd temp entry on the same day displays previous reader info and forces a recheck reason.',
    role: 'nurse',
    view: 'worklist',
    instructions: 'As Nurse, select a patient who already has a reading today (e.g. Bed 26). Click "Record Temp" again. Observe the duplicate warning banner and fill in the recheck reason.',
  },
  {
    id: 3,
    title: 'Fever Alert & Streak Reset',
    description: 'Recording a temp >= 38.0°C displays a red badge alert and resets the fever-free streak to 0.',
    role: 'nurse',
    view: 'worklist',
    instructions: 'As Nurse, record a temperature of 38.5°C for any patient. Notice the red fever badge and the streak resetting to 0 days.',
  },
  {
    id: 4,
    title: 'Streak Reaches 3 Days (Eligible)',
    description: 'Completing 3 consecutive fever-free days automatically flags patient as Discharge-Eligible.',
    role: 'nurse',
    view: 'worklist',
    instructions: 'As Nurse, locate Bed 61 (which has a 2-day streak). Record a normal temp (36.6°C) for Bed 61. Switch to Doctor role to see them highlighted as "Discharge-Eligible".',
  },
  {
    id: 5,
    title: 'Doctor Visit & Warning Banner',
    description: 'Doctor logs assessment notes & treatment. Shows warning if temp not yet recorded today.',
    role: 'doctor',
    view: 'worklist',
    instructions: 'As Doctor, view "Ready to Visit". Select a patient and click "Log Visit". Enter notes, treatment, and choose "Continue Treatment".',
  },
  {
    id: 6,
    title: 'Doctor Recommends Discharge',
    description: 'Doctor signs off an eligible patient, placing them into Admin\'s discharge queue.',
    role: 'doctor',
    view: 'worklist',
    instructions: 'As Doctor, go to "Discharge-Eligible" tab (or Bed 67). Click "Log Visit", select "Recommend Discharge", and submit. Patient will move to Admin Discharge Queue.',
  },
  {
    id: 7,
    title: 'Admin Processes Discharge',
    description: 'Admin confirms discharge, freeing the bed (occupancy drops to 73/74) and archiving patient.',
    role: 'admin',
    view: 'discharge_queue',
    instructions: 'As Admin, navigate to "Discharge Queue". Click "Process Discharge" for the patient. The bed is freed and occupancy drops to 73.',
  },
  {
    id: 8,
    title: 'Admit from Waitlist into Free Bed',
    description: 'Admin admits waitlisted patient into the newly freed bed, returning facility to 74 capacity.',
    role: 'admin',
    view: 'waitlist',
    instructions: 'As Admin, navigate to "Waitlist". Click "Admit to Bed" on Eleanor Vance and choose the freed bed. Facility capacity returns to 74/74.',
  },
  {
    id: 9,
    title: 'Doctor Records Death & Mortality Alert',
    description: 'Doctor logs patient death. Updates KPI mortality metrics and triggers >15% alert banner.',
    role: 'doctor',
    view: 'worklist',
    instructions: 'As Doctor, select a patient, click "Log Visit" -> "Record Death" and confirm. Switch to Admin Dashboard to view updated mortality rate and red alert banner.',
  },
  {
    id: 10,
    title: 'Edit Recent Reading (<1 Hour)',
    description: 'Recorder edits a temp reading within 1 hour with a mandatory reason, updating audit log.',
    role: 'nurse',
    view: 'worklist',
    instructions: 'As Nurse, click on Bed 27 to open Patient Detail. Look for a recent reading (<1h ago), click "Edit", change the value with a reason, and observe the updated streak & audit log.',
  },
  {
    id: 11,
    title: 'Waitlist Urgent Priority Toggle',
    description: 'Doctor flags a waitlist entry as urgent, bumping them to the top of the queue.',
    role: 'doctor',
    view: 'waitlist',
    instructions: 'As Doctor, view "Waitlist". Click "Mark Urgent" on Gideon Sterling. Notice Gideon immediately moves to the top of the waitlist queue.',
  },
];
