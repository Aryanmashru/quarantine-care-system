'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { CAPACITY } from '@/types';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AdmitModalProps {
  initialBed?: number;
  onClose: () => void;
}

export const AdmitModal: React.FC<AdmitModalProps> = ({ initialBed, onClose }) => {
  const { patients, admitPatient, addToWaitlist } = useFacilityStore();

  const admittedPatients = patients.filter(p => p.status === 'admitted' || p.status === 'discharge_recommended');
  const isFull = admittedPatients.length >= CAPACITY;

  const occupiedBedNumbers = new Set(admittedPatients.map(p => p.bed));
  const freeBeds: number[] = [];
  for (let b = 1; b <= CAPACITY; b++) {
    if (!occupiedBedNumbers.has(b)) {
      freeBeds.push(b);
    }
  }

  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('35');
  const [selectedBed, setSelectedBed] = useState<number>(initialBed || freeBeds[0] || 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'admit' | 'waitlist'>(isFull ? 'waitlist' : 'admit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const ageNum = parseInt(age, 10);
    if (!name.trim()) {
      setErrorMsg('Please enter patient name.');
      return;
    }
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setErrorMsg('Please enter a valid age (1 to 120).');
      return;
    }

    if (mode === 'admit') {
      if (isFull) {
        setErrorMsg('Facility is at full capacity (74 beds). Add to waitlist instead.');
        return;
      }
      const res = admitPatient(name.trim(), ageNum, selectedBed);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to admit patient.');
      }
    } else {
      const res = addToWaitlist(name.trim(), ageNum);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to add to waitlist.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {mode === 'admit' ? 'Admit New Patient' : 'Add to Waitlist'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFull
                  ? 'Facility full (74/74 beds). New entries will be queued on waitlist.'
                  : `Select free bed (${freeBeds.length} beds available)`}
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

        {/* Capacity Warning */}
        {isFull && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Facility at Capacity (74/74):</strong> Direct bed admissions disabled until a bed is freed. Add patient to waitlist.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Age *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              max="120"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {mode === 'admit' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assign Free Bed
              </label>
              {freeBeds.length === 0 ? (
                <div className="text-xs text-amber-700 font-medium">No free beds available.</div>
              ) : (
                <select
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {freeBeds.map(b => (
                    <option key={b} value={b}>
                      Bed #{b} (Free)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {!isFull && (
              <button
                type="button"
                onClick={() => setMode(mode === 'admit' ? 'waitlist' : 'admit')}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                Switch to {mode === 'admit' ? 'Add to Waitlist' : 'Direct Bed Admission'}
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
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
                {mode === 'admit' ? 'Confirm Bed Admission' : 'Add to Waitlist'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
