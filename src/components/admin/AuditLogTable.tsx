'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditLogTable: React.FC = () => {
  const { auditLogs } = useFacilityStore();
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = auditLogs.filter(log => {
    const q = filterQuery.toLowerCase().trim();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.patientId && log.patientId.toLowerCase().includes(q)) ||
      (log.detail && log.detail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">System Audit Log Trail</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological audit trail of all clinical & administrative operations.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by actor, action, or patient..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Patient ID</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500">{new Date(log.at).toLocaleString()}</td>
                  <td className="p-4 font-bold text-slate-900">{log.actor}</td>
                  <td className="p-4">
                    <span className="capitalize font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-4 text-emerald-800 font-semibold">{log.action}</td>
                  <td className="p-4 text-slate-500">{log.patientId || '—'}</td>
                  <td className="p-4 text-slate-700 max-w-md truncate">{log.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
