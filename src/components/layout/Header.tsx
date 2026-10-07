'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Role } from '@/types';
import { 
  Stethoscope, 
  UserCheck, 
  ShieldAlert, 
  RotateCcw, 
  BookOpen, 
  Bed, 
  Activity, 
  AlertTriangle
} from 'lucide-react';
import { isTempTakenToday, toDateString } from '@/utils/calculations';

interface HeaderProps {
  onToggleDemoGuide: () => void;
  isDemoGuideOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleDemoGuide, isDemoGuideOpen }) => {
  const {
    activeRole,
    setActiveRole,
    activeView,
    setActiveView,
    patients,
    readings,
    autoWithdrawNotice,
    clearAutoWithdrawNotice,
    resetDemoData,
  } = useFacilityStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const todayStr = toDateString(new Date());
  const admittedPatients = patients.filter(p => p.status === 'admitted' || p.status === 'discharge_recommended');
  const occupiedBeds = admittedPatients.length;
  const pendingTempCount = admittedPatients.filter(p => !isTempTakenToday(readings, p.id, todayStr)).length;
  const dischargeQueueCount = patients.filter(p => p.status === 'discharge_recommended').length;

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    if (role === 'nurse') setActiveView('worklist');
    else if (role === 'doctor') setActiveView('worklist');
    else if (role === 'admin') setActiveView('bed_board');
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-sm">
      
      {/* Auto-withdraw Alert Banner */}
      {autoWithdrawNotice && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Discharge Recommendation Withdrawn:</strong> {autoWithdrawNotice.patientName} (Bed {autoWithdrawNotice.bed}) recorded a fever (≥38.0°C). Status reverted to Admitted.
            </span>
          </div>
          <button
            onClick={clearAutoWithdrawNotice}
            className="text-[11px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">QuarantineCare</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  74-Bed Unit
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Quarantine & Clinical Treatment Facility</p>
            </div>
          </div>

          {/* Persona Switcher (Prominent Role Control) */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-300 shadow-inner">
            <span className="text-xs font-extrabold text-slate-600 px-3 uppercase tracking-wider hidden lg:inline">
              Active Persona:
            </span>
            <button
              onClick={() => handleRoleChange('nurse')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeRole === 'nurse'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Stethoscope className="w-4.5 h-4.5" />
              Nurse
            </button>

            <button
              onClick={() => handleRoleChange('doctor')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeRole === 'doctor'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-4.5 h-4.5" />
              Doctor
            </button>

            <button
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeRole === 'admin'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-4.5 h-4.5" />
              Admin
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Occupancy Pill */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-md text-xs font-medium">
              <Bed className="w-4 h-4 text-emerald-700" />
              <span>Beds:</span>
              <strong className="text-emerald-800 font-bold">{occupiedBeds}/74</strong>
            </div>

            {/* Demo Guide Drawer Toggle */}
            <button
              onClick={onToggleDemoGuide}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                isDemoGuideOpen
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Demo Guide</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                11 Steps
              </span>
            </button>

            {/* Reset Button (Admin role) */}
            {activeRole === 'admin' && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors"
                title="Reset demo data to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Data</span>
              </button>
            )}
          </div>

        </div>

        {/* Dynamic Navigation Bar per Persona */}
        <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1">
            {activeRole === 'nurse' && (
              <button
                onClick={() => setActiveView('worklist')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  activeView === 'worklist'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Nurse Daily Worklist ({pendingTempCount} Pending)
              </button>
            )}

            {activeRole === 'doctor' && (
              <>
                <button
                  onClick={() => setActiveView('worklist')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'worklist'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Doctor Worklist
                </button>
                <button
                  onClick={() => setActiveView('waitlist')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'waitlist'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Waitlist Review
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Performance Dashboard
                </button>
                <button
                  onClick={() => setActiveView('closed_cases')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'closed_cases'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Closed Cases
                </button>
              </>
            )}

            {activeRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveView('bed_board')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'bed_board'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Bed Board (74 Beds)
                </button>
                <button
                  onClick={() => setActiveView('discharge_queue')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors relative ${
                    activeView === 'discharge_queue'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Discharge Queue
                  {dischargeQueueCount > 0 && (
                    <span className="ml-1.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {dischargeQueueCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveView('waitlist')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'waitlist'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Admissions & Waitlist
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Performance Dashboard
                </button>
                <button
                  onClick={() => setActiveView('closed_cases')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'closed_cases'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Closed Cases
                </button>
                <button
                  onClick={() => setActiveView('audit_log')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    activeView === 'audit_log'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Audit Log
                </button>
              </>
            )}
          </nav>

          <div className="text-slate-500 text-[11px] hidden sm:block font-medium">
            Active Persona: <strong className="text-slate-900 capitalize">{activeRole}</strong>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Reset Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl text-slate-900">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold">Reset Demo Data?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This will restore all 74 patient beds, readings, visits, and waitlists back to initial seed data.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-md text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
