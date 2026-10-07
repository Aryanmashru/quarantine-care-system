'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Patient, VisitDecision } from '@/types';
import { isTempTakenToday, getFeverFreeStreak, toDateString } from '@/utils/calculations';
import { X, UserCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface VisitModalProps {
  patient: Patient;
  onClose: () => void;
}

export const VisitModal: React.FC<VisitModalProps> = ({ patient, onClose }) => {
  const { readings, recordVisit, recordTemperature } = useFacilityStore();

  const todayStr = toDateString(new Date());
  const hasTempToday = isTempTakenToday(readings, patient.id, todayStr);
  const streak = getFeverFreeStreak(readings, patient.id, todayStr);
  const isEligible = streak >= 3;

  const [notes, setNotes] = useState<string>('Patient resting comfortably. Vitals stable.');
  const [treatment, setTreatment] = useState<string>('Oral hydration and rest.');
  const [decision, setDecision] = useState<VisitDecision>('continue');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showDeathConfirm, setShowDeathConfirm] = useState<boolean>(false);
  const [doctorTemp, setDoctorTemp] = useState<string>('38.0');
  const [isRecordingDoctorTemp, setIsRecordingDoctorTemp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDoctorRecordTemp = () => {
    const val = parseFloat(doctorTemp);
    if (isNaN(val) || val < 34.0 || val > 43.0) {
      setErrorMsg('Invalid temperature value (34.0°C to 43.0°C).');
      return;
    }
    recordTemperature(patient.id, val, 'Doctor bedside reading', false);
    setIsRecordingDoctorTemp(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (decision === 'recommend_discharge' && !isEligible && !overrideReason.trim()) {
      setErrorMsg('Early discharge before 3 consecutive fever-free days requires a mandatory doctor override reason.');
      return;
    }

    if (decision === 'record_death' && !showDeathConfirm) {
      setShowDeathConfirm(true);
      return;
    }

    const doctorName = 'Dr. Robert Vance';
    const result = recordVisit(
      patient.id,
      doctorName,
      notes,
      treatment,
      decision,
      decision === 'recommend_discharge' && !isEligible ? overrideReason : undefined
    );

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to submit visit.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Log Clinical Assessment</h3>
              <p className="text-xs text-slate-500">
                Bed <strong className="text-emerald-800">{patient.bed}</strong> — {patient.name} ({patient.age}y)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if no temp recorded today */}
        {!hasTempToday && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Temperature Not Recorded Today</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordingDoctorTemp(!isRecordingDoctorTemp)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded text-[11px]"
              >
                {isRecordingDoctorTemp ? 'Cancel' : 'Record Bedside Temp'}
              </button>
            </div>

            {isRecordingDoctorTemp && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={doctorTemp}
                  onChange={(e) => setDoctorTemp(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-1 text-xs text-slate-900 w-24 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-slate-600 font-bold">°C</span>
                <button
                  type="button"
                  onClick={handleDoctorRecordTemp}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs"
                >
                  Save (Doctor-Recorded)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Streak Status Banner */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">Current Fever-Free Streak:</span>
          <span className={`font-bold flex items-center gap-1 ${
            isEligible ? 'text-emerald-700' : 'text-slate-800'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Day {streak} of 3 {isEligible ? '(Discharge Eligible)' : '(Awaiting 3 days)'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Assessment Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              placeholder="Record clinical observations, vitals..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Treatment / Prescription Orders
            </label>
            <input
              type="text"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              placeholder="e.g. Paracetamol 500mg, IV fluids"
            />
          </div>

          {/* Decision Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Clinical Decision
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              
              <button
                type="button"
                onClick={() => setDecision('continue')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                  decision === 'continue'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Continue Treatment
              </button>

              <button
                type="button"
                onClick={() => setDecision('recommend_discharge')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                  decision === 'recommend_discharge'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Recommend Discharge
                {isEligible && <span className="block text-[10px] text-emerald-100 font-normal">Eligible (3d)</span>}
              </button>

              <button
                type="button"
                onClick={() => setDecision('record_death')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                  decision === 'record_death'
                    ? 'bg-red-600 border-red-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-red-700 hover:bg-red-50'
                }`}
              >
                Record Death
              </button>

            </div>
          </div>

          {/* Override Reason Field */}
          {decision === 'recommend_discharge' && !isEligible && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
              <p className="text-xs text-amber-900 font-medium">
                ⚠️ Early Discharge: Patient has only {streak} consecutive fever-free day(s).
              </p>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
                placeholder="Mandatory early discharge justification..."
                className="w-full bg-white border border-amber-300 rounded p-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          )}

          {/* Death Confirmation */}
          {showDeathConfirm && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>CONFIRM PATIENT DEATH RECORD</span>
              </div>
              <p className="text-red-900 leading-snug">
                Confirm death record for <strong>{patient.name}</strong> (Bed {patient.bed})? This will close the record and free the bed.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeathConfirm(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs shadow-xs"
                >
                  Confirm Death
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {!showDeathConfirm && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Submit Clinical Visit
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
