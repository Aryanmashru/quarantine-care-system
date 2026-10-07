'use client';

import React from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { calculateDashboardMetrics } from '@/utils/calculations';
import { CAPACITY, MORTALITY_BENCHMARK } from '@/types';
import { 
  Activity, 
  XCircle, 
  TrendingUp, 
  Clock, 
  Bed, 
  Award,
  ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const PerformanceDashboard: React.FC = () => {
  const { patients } = useFacilityStore();

  const metrics = calculateDashboardMetrics(patients);
  const admittedCount = patients.filter(p => p.status === 'admitted' || p.status === 'discharge_recommended').length;
  const occupancyPercentage = Math.round((admittedCount / CAPACITY) * 100);

  const chartData = [
    { name: 'Cured Discharges', count: metrics.cured, fill: '#059669' },
    { name: 'Deceased Cases', count: metrics.deceased, fill: '#dc2626' },
    { name: 'Early Overrides', count: metrics.earlyDischarges, fill: '#d97706' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Facility Performance & Outcomes</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical outcome metrics benchmarked against 85% cure / 15% mortality standards.
          </p>
        </div>

        <div className="bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
          Closed Cases Evaluated: <strong className="text-slate-900 font-bold">{metrics.totalClosed}</strong>
        </div>
      </div>

      {/* Benchmark Alert Banner */}
      {metrics.isMortalityAlert && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-lg text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-900 uppercase tracking-wider">
                CRITICAL ALERT: Mortality Benchmark Exceeded
              </h3>
              <p className="text-xs text-red-800 mt-0.5 leading-snug">
                Current mortality is <strong className="text-red-950 font-extrabold">{Math.round(metrics.mortalityRate * 1000) / 10}%</strong> across {metrics.totalClosed} closed cases, exceeding the 15.0% benchmark. Clinical review recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Bed Occupancy</span>
            <Bed className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{admittedCount} / {CAPACITY}</div>
            <div className="text-xs text-emerald-700 font-bold mt-0.5">{occupancyPercentage}% Occupied</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Cure Rate (vs 85%)</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {Math.round(metrics.cureRate * 1000) / 10}%
            </div>
            <div className="text-xs text-emerald-700 font-bold mt-0.5">
              {metrics.cured} Cured Patients
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between space-y-2 ${
          metrics.mortalityRate > MORTALITY_BENCHMARK
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Mortality Rate</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className={`text-2xl font-extrabold ${metrics.mortalityRate > MORTALITY_BENCHMARK ? 'text-red-700' : 'text-slate-900'}`}>
              {Math.round(metrics.mortalityRate * 1000) / 10}%
            </div>
            <div className="text-xs text-red-700 font-bold mt-0.5">
              {metrics.deceased} Deceased Cases
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Avg Length of Stay</span>
            <Clock className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.avgLengthOfStay} Days</div>
            <div className="text-xs text-slate-600 font-medium mt-0.5">
              {metrics.earlyDischarges} Early Overrides
            </div>
          </div>
        </div>

      </div>

      {/* Outcomes Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" />
          Patient Outcomes Breakdown
        </h3>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
