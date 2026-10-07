'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { getLengthOfStayDays } from '@/utils/calculations';
import { Search, FileText, CheckCircle2, XCircle } from 'lucide-react';

export const ClosedCasesTable: React.FC = () => {
  const { patients, setSelectedPatientId } = useFacilityStore();
  const [searchQuery, setSearchQuery] = useState('');

  const closedPatients = patients
    .filter(p => p.status === 'discharged' || p.status === 'deceased')
    .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime());

  const filtered = closedPatients.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Closed Cases Archive</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical read-only records of all discharged and deceased patients. Click any row to view temperature trend chart.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Age</th>
                <th className="p-4">Outcome</th>
                <th className="p-4">Admitted</th>
                <th className="p-4">Closed</th>
                <th className="p-4">Length of Stay</th>
                <th className="p-4">Notes / Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((patient) => {
                const los = getLengthOfStayDays(patient.admittedAt, patient.closedAt);
                const isDischarged = patient.status === 'discharged';

                return (
                  <tr 
                    key={patient.id} 
                    onClick={() => setSelectedPatientId(patient.id)}
                    className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                    title="Click to view temperature trend chart"
                  >
                    <td className="p-4 font-bold text-slate-900 hover:text-emerald-700">
                      {patient.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{patient.id}</span>
                    </td>
                    <td className="p-4">{patient.age}y</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                        isDischarged
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {isDischarged ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <XCircle className="w-3 h-3 text-red-600" />}
                        {patient.status}
                      </span>
                    </td>
                    <td className="p-4">{new Date(patient.admittedAt).toLocaleDateString()}</td>
                    <td className="p-4">{patient.closedAt ? new Date(patient.closedAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4 font-bold text-slate-800">{los} Days</td>
                    <td className="p-4 text-amber-800 font-medium">
                      {patient.dischargeOverrideReason || <span className="text-slate-400 font-normal">Standard discharge policy</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
