'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Patient } from '@/types';
import { 
  isTempTakenToday, 
  isDoctorVisitedToday, 
  getReadingsForToday, 
  getFeverFreeStreak, 
  isOverdueDischarge,
  celsiusToFahrenheit,
  toDateString 
} from '@/utils/calculations';
import { VisitModal } from './VisitModal';
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  Thermometer, 
  Sparkles, 
  Search, 
  Award,
  AlertTriangle
} from 'lucide-react';

export const DoctorWorklist: React.FC = () => {
  const { patients, readings, visits, setSelectedPatientId, setActiveView } = useFacilityStore();

  const [tab, setTab] = useState<'ready' | 'awaiting' | 'visited' | 'eligible'>('ready');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalPatient, setActiveModalPatient] = useState<Patient | null>(null);

  const todayStr = toDateString(new Date());

  const admittedPatients = patients
    .filter(p => p.status === 'admitted' || p.status === 'discharge_recommended')
    .sort((a, b) => a.bed - b.bed);

  const readyToVisit = admittedPatients.filter(
    p => isTempTakenToday(readings, p.id, todayStr) && !isDoctorVisitedToday(visits, p.id, todayStr)
  );

  const awaitingTemp = admittedPatients.filter(
    p => !isTempTakenToday(readings, p.id, todayStr)
  );

  const visitedToday = admittedPatients.filter(
    p => isDoctorVisitedToday(visits, p.id, todayStr)
  );

  const dischargeEligible = admittedPatients.filter(
    p => getFeverFreeStreak(readings, p.id, todayStr) >= 3
  );

  let currentList: Patient[] = [];
  if (tab === 'ready') currentList = readyToVisit;
  else if (tab === 'awaiting') currentList = awaitingTemp;
  else if (tab === 'visited') currentList = visitedToday;
  else if (tab === 'eligible') currentList = dischargeEligible;

  const filteredList = currentList.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.bed.toString().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Doctor Clinical Worklist</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Perform daily clinical visits after temperature measurement. Recommend discharge for patients with 3 consecutive fever-free days.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">
          <Award className="w-5 h-5 text-emerald-700" />
          <div>
            <div className="text-[10px] text-emerald-800 font-bold uppercase">Discharge Eligible</div>
            <div className="text-sm font-extrabold text-slate-900">{dischargeEligible.length} Patients</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setTab('ready')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'ready'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready to Visit</span>
            <span className="bg-emerald-800 text-white px-2 py-0.5 rounded-full text-[10px]">
              {readyToVisit.length}
            </span>
          </button>

          <button
            onClick={() => setTab('eligible')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'eligible'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Discharge Eligible (3d)</span>
            <span className="bg-emerald-900 text-white px-2 py-0.5 rounded-full text-[10px]">
              {dischargeEligible.length}
            </span>
          </button>

          <button
            onClick={() => setTab('awaiting')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'awaiting'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Awaiting Temp</span>
            <span className="bg-amber-700 text-white px-2 py-0.5 rounded-full text-[10px]">
              {awaitingTemp.length}
            </span>
          </button>

          <button
            onClick={() => setTab('visited')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'visited'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Visited Today</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-[10px]">
              {visitedToday.length}
            </span>
          </button>

        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient or bed..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

      </div>

      {/* Patient Cards List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">No patients in this view</h3>
            <p className="text-xs text-slate-500">Select another tab to inspect active patient queues.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((patient) => {
              const streak = getFeverFreeStreak(readings, patient.id, todayStr);
              const isOverdue = isOverdueDischarge(patient, readings, visits, todayStr);
              const patientReadingsToday = getReadingsForToday(readings, patient.id, todayStr);
              const latestReading = patientReadingsToday[0];
              const isRecommended = patient.status === 'discharge_recommended';

              return (
                <div
                  key={patient.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isOverdue ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-800">
                      <span className="text-[9px] uppercase text-slate-500 font-semibold leading-none">Bed</span>
                      <span className="text-sm text-emerald-800 leading-none mt-0.5">{patient.bed}</span>
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

                        {isOverdue && (
                          <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            OVERDUE DISCHARGE
                          </span>
                        )}

                        {isRecommended && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                            Discharge Recommended
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                        <span className={`font-semibold flex items-center gap-1 ${
                          streak >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-600'
                        }`}>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          {streak >= 3 ? `Streak: ${streak} Days (Eligible)` : `Streak: Day ${streak} of 3`}
                        </span>

                        {latestReading ? (
                          <span className={`font-bold flex items-center gap-1 px-2 py-0.5 rounded ${
                            latestReading.value >= 38.0
                              ? 'bg-red-100 text-red-800 border border-red-300 font-extrabold'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}>
                            <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
                            {celsiusToFahrenheit(latestReading.value)}°F
                          </span>
                        ) : (
                          <span className="text-amber-800 italic flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Temp Pending Today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                      Chart & History
                    </button>

                    <button
                      onClick={() => setActiveModalPatient(patient)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        streak >= 3
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{streak >= 3 ? 'Recommend Discharge' : 'Log Visit'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeModalPatient && (
        <VisitModal
          patient={activeModalPatient}
          onClose={() => setActiveModalPatient(null)}
        />
      )}

    </div>
  );
};
