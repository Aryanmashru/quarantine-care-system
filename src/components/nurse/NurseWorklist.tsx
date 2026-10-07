'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Patient } from '@/types';
import { 
  isTempTakenToday, 
  getReadingsForToday, 
  getFeverFreeStreak, 
  celsiusToFahrenheit,
  toDateString 
} from '@/utils/calculations';
import { RecordTempModal } from './RecordTempModal';
import { 
  Search, 
  Thermometer, 
  CheckCircle2, 
  Clock, 
  CalendarCheck
} from 'lucide-react';

export const NurseWorklist: React.FC = () => {
  const { patients, readings, setSelectedPatientId, setActiveView } = useFacilityStore();

  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalPatient, setActiveModalPatient] = useState<Patient | null>(null);

  const todayStr = toDateString(new Date());

  const admittedPatients = patients
    .filter(p => p.status === 'admitted' || p.status === 'discharge_recommended')
    .sort((a, b) => a.bed - b.bed);

  const donePatients = admittedPatients.filter(p => isTempTakenToday(readings, p.id, todayStr));
  const pendingPatients = admittedPatients.filter(p => !isTempTakenToday(readings, p.id, todayStr));

  const currentList = tab === 'pending' ? pendingPatients : donePatients;

  const filteredList = currentList.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.bed.toString().includes(q);
  });

  const totalRecordedCount = donePatients.length;

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Thermometer className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Nurse Daily Temperature Worklist</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record every patient&apos;s temperature exactly once per day. Patients in Done Today will appear on the Doctor&apos;s visit list.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Daily Completion</div>
            <div className="text-base font-bold text-slate-900">
              <span className="text-emerald-700 font-extrabold">{totalRecordedCount}</span> / 74 Beds
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-emerald-600 flex items-center justify-center font-bold text-xs text-emerald-800 bg-emerald-50">
            {Math.round((totalRecordedCount / 74) * 100)}%
          </div>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              tab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Temp Today</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tab === 'pending' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingPatients.length}
            </span>
          </button>

          <button
            onClick={() => setTab('done')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              tab === 'done'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done Today</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tab === 'done' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {donePatients.length}
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
            placeholder="Search by name or bed number..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

      </div>

      {/* Patient Rows Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">No patients found</h3>
            <p className="text-xs text-slate-500">
              {tab === 'pending'
                ? 'All patients have had their temperature recorded today!'
                : 'No temperature readings recorded yet today.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((patient) => {
              const patientReadingsToday = getReadingsForToday(readings, patient.id, todayStr);
              const latestTodayReading = patientReadingsToday[0];
              const streak = getFeverFreeStreak(readings, patient.id, todayStr);
              const isFever = latestTodayReading && latestTodayReading.value >= 38.0;

              return (
                <div
                  key={patient.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Bed & Details */}
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

                        {patient.status === 'discharge_recommended' && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                            Discharge Recommended
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {streak >= 3 ? `Streak: ${streak} Days (Eligible)` : `Streak: Day ${streak} of 3`}
                        </span>

                        {latestTodayReading ? (
                          <span className={`font-bold flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            isFever
                              ? 'bg-red-100 text-red-800 border border-red-300 font-extrabold'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}>
                            <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
                            {celsiusToFahrenheit(latestTodayReading.value)}°F
                            {isFever && <span className="text-[10px] font-extrabold text-red-700 ml-1">FEVER (≥100.4°F)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No temp today</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                      History & Chart
                    </button>

                    <button
                      onClick={() => setActiveModalPatient(patient)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        latestTodayReading
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>{latestTodayReading ? 'Recheck Temp' : 'Record Temp'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Modal */}
      {activeModalPatient && (
        <RecordTempModal
          patient={activeModalPatient}
          onClose={() => setActiveModalPatient(null)}
        />
      )}

    </div>
  );
};
