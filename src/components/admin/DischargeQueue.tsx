'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { getFeverFreeStreak, getLengthOfStayDays, toDateString } from '@/utils/calculations';
import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export const DischargeQueue: React.FC = () => {
  const { patients, readings, visits, processDischarge, setSelectedPatientId, setActiveView, activeRole } = useFacilityStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayStr = toDateString(new Date());
  const dischargeQueuePatients = patients.filter(p => p.status === 'discharge_recommended');

  const handleProcessDischarge = (pId: string, bedNum: number, name: string) => {
    const res = processDischarge(pId);
    if (res.success) {
      setSuccessMsg(`Successfully discharged ${name} from Bed #${bedNum}. Bed is now free.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Admin Discharge Processing Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review patients signed off by doctors for discharge. Processing a discharge frees their bed for new admissions.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <div>
            <div className="text-slate-600 font-medium">Awaiting Sign-off</div>
            <div className="text-sm font-extrabold text-slate-900">{dischargeQueuePatients.length} Patients</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Discharge Queue List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {dischargeQueuePatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">Discharge Queue Empty</h3>
            <p className="text-xs text-slate-500">No patients currently awaiting discharge sign-off.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dischargeQueuePatients.map((patient) => {
              const streak = getFeverFreeStreak(readings, patient.id, todayStr);
              const patientVisits = visits.filter(v => v.patientId === patient.id);
              const latestVisit = patientVisits[0];

              return (
                <div
                  key={patient.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-emerald-100 border border-emerald-200 flex flex-col items-center justify-center font-bold text-emerald-900">
                      <span className="text-[9px] uppercase text-emerald-800 font-semibold leading-none">Bed</span>
                      <span className="text-sm leading-none mt-0.5">{patient.bed}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPatientId(patient.id)}
                          className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors text-left"
                        >
                          {patient.name}
                        </button>
                        <span className="text-xs text-slate-500">({patient.age}y)</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                          Streak: {streak} Days
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                        <div>
                          Length of Stay: <strong>{getLengthOfStayDays(patient.admittedAt)} days</strong>
                        </div>
                        {latestVisit && (
                          <div className="text-slate-500 text-[11px]">
                            Recommended by <strong>{latestVisit.doctor}</strong>: &quot;{latestVisit.notes}&quot;
                          </div>
                        )}
                        {patient.dischargeOverrideReason && (
                          <div className="text-amber-800 text-[11px] font-semibold">
                            Early Discharge Override: {patient.dischargeOverrideReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                      View Chart
                    </button>

                    <button
                      onClick={() => handleProcessDischarge(patient.id, patient.bed, patient.name)}
                      disabled={activeRole !== 'admin'}
                      className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
                        activeRole === 'admin'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Process Discharge & Free Bed</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
