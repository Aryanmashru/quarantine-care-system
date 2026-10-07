'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Patient, TempReading } from '@/types';
import { 
  getFeverFreeStreak, 
  toDateString, 
  getLengthOfStayDays,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature
} from '@/utils/calculations';
import { 
  X, 
  UserCheck, 
  Sparkles, 
  Calendar, 
  Edit3, 
  Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, CartesianGrid } from 'recharts';

interface PatientDetailModalProps {
  patientId: string;
  onClose: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patientId, onClose }) => {
  const { patients, readings, visits, editRecentTemperature, activeRole } = useFacilityStore();

  const patient = patients.find(p => p.id === patientId);
  const [editingReading, setEditingReading] = useState<TempReading | null>(null);
  const [editValueF, setEditValueF] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  if (!patient) return null;

  const todayStr = toDateString(new Date());
  const streak = getFeverFreeStreak(readings, patient.id, todayStr);
  const patientReadings = readings
    .filter(r => r.patientId === patient.id)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const patientVisits = visits
    .filter(v => v.patientId === patient.id)
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());

  const chartData = patientReadings.map(r => ({
    date: new Date(r.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    tempF: celsiusToFahrenheit(r.value),
    tempC: r.value,
    threshold: 100.4,
  }));

  const handleStartEdit = (r: TempReading) => {
    setEditingReading(r);
    setEditValueF(celsiusToFahrenheit(r.value).toString());
    setEditReason('');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReading) return;

    const valF = parseFloat(editValueF);
    const valC = fahrenheitToCelsius(valF);
    if (isNaN(valF) || valC < 34.0 || valC > 43.0) {
      setEditError('Invalid value. Temperature must be between 93.2°F and 109.4°F (34.0°C and 43.0°C).');
      return;
    }

    if (!editReason.trim()) {
      setEditError('Editing a reading requires a mandatory reason.');
      return;
    }

    const res = editRecentTemperature(editingReading.id, valC, editReason);
    if (res.success) {
      setEditingReading(null);
    } else {
      setEditError(res.error || 'Failed to edit reading.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl text-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex flex-col items-center justify-center font-bold">
              <span className="text-[9px] uppercase text-slate-500">Bed</span>
              <span className="text-base leading-none">{patient.bed || 'Out'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
                <span className="text-xs text-slate-500">({patient.age} years old)</span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  patient.status === 'admitted'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : patient.status === 'discharge_recommended'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : patient.status === 'discharged'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {patient.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Admitted: {new Date(patient.admittedAt).toLocaleDateString()}
                </span>
                <span>Length of stay: {getLengthOfStayDays(patient.admittedAt, patient.closedAt)} days</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Streak Banner */}
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-200 text-emerald-800">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-600 font-medium">Fever-Free Streak (&lt;100.4°F)</div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-800">
                    {streak >= 3 ? `${streak} Consecutive Fever-Free Days` : `Day ${streak} of 3 Fever-Free`}
                  </span>
                  {streak >= 3 ? (
                    <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                      Eligible for Discharge
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-normal">
                      ({3 - streak} more day{3 - streak > 1 ? 's' : ''} needed)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Chart (°F) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                Temperature Trend (°F)
              </h3>
              <div className="flex items-center gap-2 bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-md text-xs font-bold">
                <span className="w-3 h-1 bg-red-600 rounded-full inline-block" />
                <span>FEVER THRESHOLD: 100.4°F (38.0°C)</span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-xs text-slate-400">
                No temperature readings recorded yet.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis domain={[95, 106]} stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px' }}
                      itemStyle={{ color: '#047857' }}
                      formatter={(val: any) => [`${val}°F`, 'Temperature']}
                    />
                    {/* Shaded Fever Zone (>100.4°F) */}
                    <ReferenceArea y1={100.4} y2={107} fill="#fee2e2" fillOpacity={0.6} />
                    
                    {/* Bold Fever Threshold Line */}
                    <ReferenceLine 
                      y={100.4} 
                      stroke="#dc2626" 
                      strokeWidth={2.5} 
                      strokeDasharray="6 3" 
                      label={{ 
                        value: '⚠️ 100.4°F FEVER THRESHOLD', 
                        position: 'insideTopLeft', 
                        fill: '#b91c1c', 
                        fontSize: 11, 
                        fontWeight: 'bold' 
                      }} 
                    />
                    <Line type="monotone" dataKey="tempF" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: '#047857' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Readings History */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Temperature History ({patientReadings.length})
            </h3>

            <div className="space-y-1.5">
              {patientReadings.slice().reverse().map((reading) => {
                const isRecent = Date.now() - new Date(reading.recordedAt).getTime() <= 3600000;
                const isAuthor = reading.recordedByRole === activeRole;
                const isFever = reading.value >= 38.0;

                return (
                  <div
                    key={reading.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs border ${
                        isFever ? 'bg-red-50 text-red-800 border-red-200 font-extrabold' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}>
                        {formatTemperature(reading.value, 'F')}
                      </span>
                      <div>
                        <div className="text-slate-900 font-semibold flex items-center gap-2">
                          <span>{new Date(reading.recordedAt).toLocaleString()}</span>
                          {reading.isRecheck && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                              Recheck ({reading.recheckReason})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Recorded by: <strong>{reading.recordedBy}</strong> ({reading.recordedByRole})
                          {reading.editedAt && (
                            <span className="ml-2 text-amber-800 font-medium">
                              (Edited: {reading.editReason})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isRecent && (
                      <button
                        onClick={() => isAuthor && handleStartEdit(reading)}
                        disabled={!isAuthor}
                        title={!isAuthor ? `Only the recorder (${reading.recordedByRole}) can edit this reading` : 'Edit temperature reading'}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded border font-semibold transition-colors text-xs ${
                          isAuthor
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit (&lt;1h)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doctor Visits */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Doctor Visit Timeline ({patientVisits.length})
            </h3>

            {patientVisits.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                No doctor visits recorded for this patient yet.
              </div>
            ) : (
              <div className="space-y-2">
                {patientVisits.map((visit) => (
                  <div key={visit.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-800">
                      <span className="font-bold text-emerald-800">{visit.doctor}</span>
                      <span className="text-slate-500 text-[11px]">{new Date(visit.visitedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-800"><strong>Notes:</strong> {visit.notes}</p>
                    <p className="text-slate-600"><strong>Treatment:</strong> {visit.treatment}</p>
                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                        Decision: {visit.decision.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Edit Reading Sub-Modal */}
        {editingReading && (
          <div className="fixed inset-0 bg-slate-900/50 z-60 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Edit Recent Temperature Reading (°F)
              </h3>

              <div>
                <label className="block text-xs text-slate-700 mb-1">New Value (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editValueF}
                  onChange={(e) => setEditValueF(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1">Mandatory Edit Reason *</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Thermometer re-calibration correction"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {editError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingReading(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
                >
                  Save Correction
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
