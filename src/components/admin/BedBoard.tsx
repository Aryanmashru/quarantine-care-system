'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Patient, CAPACITY } from '@/types';
import { AdmitModal } from './AdmitModal';
import { Bed, UserPlus, Sparkles } from 'lucide-react';
import { getFeverFreeStreak, toDateString } from '@/utils/calculations';

export const BedBoard: React.FC = () => {
  const { patients, readings, setSelectedPatientId, setActiveView, activeRole } = useFacilityStore();
  const [selectedFreeBed, setSelectedFreeBed] = useState<number | null>(null);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState<boolean>(false);

  const todayStr = toDateString(new Date());

  const bedMap = new Map<number, Patient>();
  patients
    .filter(p => p.status === 'admitted' || p.status === 'discharge_recommended')
    .forEach(p => {
      bedMap.set(p.bed, p);
    });

  const occupiedCount = bedMap.size;
  const freeCount = CAPACITY - occupiedCount;
  const dischargeRecCount = Array.from(bedMap.values()).filter(p => p.status === 'discharge_recommended').length;

  return (
    <div className="space-y-6">
      
      {/* Header Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Bed className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Facility Bed Board Map</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual map of all 74 isolation beds. Click any occupied bed to view patient detail, or click a free bed to admit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Occupied:</span>{' '}
              <strong className="text-slate-900 font-bold">{occupiedCount}/74</strong>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 font-medium">Discharge Queue:</span>{' '}
              <strong className="text-emerald-800 font-bold">{dischargeRecCount}</strong>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 font-medium">Free:</span>{' '}
              <strong className={freeCount > 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>{freeCount}</strong>
            </div>
          </div>

          {activeRole === 'admin' && (
            <button
              onClick={() => {
                setSelectedFreeBed(null);
                setIsAdmitModalOpen(true);
              }}
              disabled={occupiedCount >= CAPACITY}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-bold transition-all shadow-xs ${
                occupiedCount >= CAPACITY
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{occupiedCount >= CAPACITY ? 'Facility Full' : 'Admit Patient'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
        <span className="font-bold text-slate-500">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300" />
          <span>Occupied (Admitted)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-400" />
          <span>Discharge Recommended</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-white border border-slate-300 border-dashed" />
          <span>Free Bed</span>
        </div>
      </div>

      {/* 74 Beds Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
        {Array.from({ length: CAPACITY }, (_, i) => i + 1).map((bedNum) => {
          const patient = bedMap.get(bedNum);

          if (!patient) {
            return (
              <button
                key={bedNum}
                onClick={() => {
                  if (activeRole === 'admin') {
                    setSelectedFreeBed(bedNum);
                    setIsAdmitModalOpen(true);
                  }
                }}
                className="p-3 rounded-lg bg-white border border-slate-300 border-dashed hover:border-emerald-600 flex flex-col items-center justify-center text-center transition-all min-h-[85px] group"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase">Bed {bedNum}</span>
                <span className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  Free
                </span>
              </button>
            );
          }

          const streak = getFeverFreeStreak(readings, patient.id, todayStr);
          const isRecommended = patient.status === 'discharge_recommended';

          return (
            <div
              key={bedNum}
              onClick={() => setSelectedPatientId(patient.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between min-h-[85px] ${
                isRecommended
                  ? 'bg-emerald-50 border-emerald-400 text-slate-900 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-emerald-500 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  #{patient.bed}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  streak >= 3 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {streak}d
                </span>
              </div>

              <div className="my-1">
                <div className="font-bold text-xs truncate text-slate-900" title={patient.name}>
                  {patient.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {patient.age}y
                </div>
              </div>

              {isRecommended && (
                <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-tight truncate flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Ready to Discharge
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmitModalOpen && (
        <AdmitModal
          initialBed={selectedFreeBed || undefined}
          onClose={() => {
            setIsAdmitModalOpen(false);
            setSelectedFreeBed(null);
          }}
        />
      )}

    </div>
  );
};
