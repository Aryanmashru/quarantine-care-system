'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { CAPACITY } from '@/types';
import { Users, AlertTriangle, UserPlus, CheckCircle2 } from 'lucide-react';

export const WaitlistManager: React.FC = () => {
  const { waitlist, patients, toggleWaitlistUrgent, admitFromWaitlist, activeRole, addToWaitlist } = useFacilityStore();

  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('30');
  const [msg, setMsg] = useState<string | null>(null);

  const admittedCount = patients.filter(p => p.status === 'admitted' || p.status === 'discharge_recommended').length;
  const freeBedCount = CAPACITY - admittedCount;

  const occupiedBeds = new Set(patients.filter(p => p.status === 'admitted' || p.status === 'discharge_recommended').map(p => p.bed));
  const freeBeds: number[] = [];
  for (let b = 1; b <= CAPACITY; b++) {
    if (!occupiedBeds.has(b)) freeBeds.push(b);
  }

  const handleAddWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addToWaitlist(newName.trim(), parseInt(newAge, 10) || 30);
    setNewName('');
    setMsg('Added patient to waitlist queue.');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleAdmitFromWaitlistSubmit = (wId: string) => {
    if (freeBeds.length === 0) {
      setMsg('Error: No free beds available in facility.');
      return;
    }
    const chosenBed = freeBeds[0];
    const res = admitFromWaitlist(wId, chosenBed);
    if (res.success) {
      setMsg(`Admitted patient to Bed #${chosenBed}.`);
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg(res.error || 'Failed to admit.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Waitlist & Admissions Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            First-come, first-served admissions queue with Doctor urgent priority toggle.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Waitlist:</span>{' '}
            <strong className="text-slate-900 font-bold">{waitlist.length} Patients</strong>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 font-medium">Free Beds:</span>{' '}
            <strong className={freeBedCount > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>{freeBedCount}</strong>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{msg}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Add New Patient to Waitlist
          </h3>
          {activeRole !== 'admin' && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              🔒 Admin Only Feature
            </span>
          )}
        </div>
        <form onSubmit={handleAddWaitlist} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Patient Full Name"
            disabled={activeRole !== 'admin'}
            title={activeRole !== 'admin' ? 'Only Admin can add patients to the waitlist' : ''}
            required
            className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            value={newAge}
            onChange={(e) => setNewAge(e.target.value)}
            placeholder="Age"
            disabled={activeRole !== 'admin'}
            title={activeRole !== 'admin' ? 'Only Admin can add patients to the waitlist' : ''}
            required
            className="w-full sm:w-24 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={activeRole !== 'admin'}
            title={activeRole !== 'admin' ? 'Only Admin can add patients to the waitlist' : 'Add patient to queue'}
            className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Queue
          </button>
        </form>
      </div>

      {/* Waitlist List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {waitlist.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">Waitlist is Empty</h3>
            <p className="text-xs text-slate-500">No patients currently queued on waitlist.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {waitlist.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  entry.urgent ? 'bg-red-50/60 border-l-4 border-l-red-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                    entry.urgent ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{entry.name}</span>
                      <span className="text-xs text-slate-500">({entry.age}y)</span>

                      {entry.urgent && (
                        <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          URGENT PRIORITY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Queued: {new Date(entry.addedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => activeRole === 'doctor' && toggleWaitlistUrgent(entry.id)}
                    disabled={activeRole !== 'doctor'}
                    title={activeRole !== 'doctor' ? 'Only Doctors can flag waitlist entries as urgent' : 'Toggle urgent priority'}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      entry.urgent
                        ? 'bg-red-100 hover:bg-red-200 text-red-800 border border-red-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    } ${activeRole !== 'doctor' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {entry.urgent ? 'Remove Urgent' : 'Mark Urgent (Doctor)'}
                  </button>

                  {activeRole === 'admin' && (
                    <div className="flex items-center gap-2">
                      {freeBeds.length > 0 ? (
                        <button
                          onClick={() => handleAdmitFromWaitlistSubmit(entry.id)}
                          className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Admit to Bed #{freeBeds[0]}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">No beds free</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
