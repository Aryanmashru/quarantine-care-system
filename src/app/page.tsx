'use client';

import React, { useState, useEffect } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Header } from '@/components/layout/Header';
import { DemoGuideDrawer } from '@/components/layout/DemoGuideDrawer';
import { NurseWorklist } from '@/components/nurse/NurseWorklist';
import { DoctorWorklist } from '@/components/doctor/DoctorWorklist';
import { BedBoard } from '@/components/admin/BedBoard';
import { DischargeQueue } from '@/components/admin/DischargeQueue';
import { WaitlistManager } from '@/components/admin/WaitlistManager';
import { PerformanceDashboard } from '@/components/dashboard/PerformanceDashboard';
import { ClosedCasesTable } from '@/components/common/ClosedCasesTable';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { PatientDetailModal } from '@/components/patient/PatientDetailModal';

export default function Home() {
  const { activeRole, activeView, selectedPatientId, setSelectedPatientId } = useFacilityStore();
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Loading QuarantineCare System...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Header */}
      <Header
        onToggleDemoGuide={() => setIsDemoGuideOpen(!isDemoGuideOpen)}
        isDemoGuideOpen={isDemoGuideOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeRole === 'nurse' && (
          <NurseWorklist />
        )}

        {activeRole === 'doctor' && (
          <>
            {activeView === 'worklist' && <DoctorWorklist />}
            {activeView === 'waitlist' && <WaitlistManager />}
            {activeView === 'dashboard' && <PerformanceDashboard />}
            {activeView === 'closed_cases' && <ClosedCasesTable />}
          </>
        )}

        {activeRole === 'admin' && (
          <>
            {activeView === 'bed_board' && <BedBoard />}
            {activeView === 'discharge_queue' && <DischargeQueue />}
            {activeView === 'waitlist' && <WaitlistManager />}
            {activeView === 'dashboard' && <PerformanceDashboard />}
            {activeView === 'closed_cases' && <ClosedCasesTable />}
            {activeView === 'audit_log' && <AuditLogTable />}
          </>
        )}

        {/* Selected Patient Detail View Modal */}
        {selectedPatientId && (
          <PatientDetailModal
            patientId={selectedPatientId}
            onClose={() => setSelectedPatientId(null)}
          />
        )}
      </main>

      {/* Demo Guide Drawer */}
      <DemoGuideDrawer
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">QuarantineCare Clinical Management System — 74-Bed Unit</span>
          <span className="text-slate-500">
            Next.js Static Export ready for Cloudflare Pages
          </span>
        </div>
      </footer>

    </div>
  );
}
