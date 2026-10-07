'use client';

import React, { useState } from 'react';
import { useFacilityStore } from '@/store/useFacilityStore';
import { Patient, FEVER_THRESHOLD_C, FEVER_THRESHOLD_F } from '@/types';
import { 
  isTempTakenToday, 
  getReadingsForToday, 
  celsiusToFahrenheit, 
  fahrenheitToCelsius,
  formatTempShort,
  toDateString 
} from '@/utils/calculations';
import { X, Thermometer, AlertTriangle, Clock } from 'lucide-react';

interface RecordTempModalProps {
  patient: Patient;
  onClose: () => void;
}

export const RecordTempModal: React.FC<RecordTempModalProps> = ({ patient, onClose }) => {
  const { readings, recordTemperature } = useFacilityStore();

  const [unit, setUnit] = useState<'F' | 'C'>('F');
  const [inputValue, setInputValue] = useState<string>('100.4');
  const [recheckReason, setRecheckReason] = useState<string>('');
  const [isLateEntry, setIsLateEntry] = useState<boolean>(false);
  const [confirmedSoftWarning, setConfirmedSoftWarning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = toDateString(new Date());
  const todayReadings = getReadingsForToday(readings, patient.id, todayStr);
  const hasReadingToday = todayReadings.length > 0;
  const lastReadingToday = todayReadings[0];

  const numericInput = parseFloat(inputValue);
  const valueInCelsius = isNaN(numericInput)
    ? 0
    : unit === 'C'
    ? numericInput
    : fahrenheitToCelsius(numericInput);

  const isHardBlock = isNaN(numericInput) || valueInCelsius < 34.0 || valueInCelsius > 43.0;
  const isSoftWarning =
    !isHardBlock &&
    ((valueInCelsius >= 34.0 && valueInCelsius <= 35.0) || (valueInCelsius >= 41.0 && valueInCelsius <= 43.0));
  const isFever = !isHardBlock && valueInCelsius >= FEVER_THRESHOLD_C;

  const handleUnitToggle = (newUnit: 'F' | 'C') => {
    if (newUnit === unit) return;
    const currentNum = parseFloat(inputValue);
    if (!isNaN(currentNum)) {
      if (newUnit === 'F') {
        setInputValue(celsiusToFahrenheit(currentNum).toString());
      } else {
        setInputValue(fahrenheitToCelsius(currentNum).toString());
      }
    }
    setUnit(newUnit);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isHardBlock) {
      setErrorMsg('Temperature value out of range (93.2°F to 109.4°F / 34.0°C to 43.0°C). Check typing error.');
      return;
    }

    if (isSoftWarning && !confirmedSoftWarning) {
      setErrorMsg('Please confirm extreme temperature value checkbox before submitting.');
      return;
    }

    if (hasReadingToday && !recheckReason.trim()) {
      setErrorMsg('Duplicate same-day reading requires a recheck reason.');
      return;
    }

    const result = recordTemperature(
      patient.id,
      valueInCelsius,
      hasReadingToday ? recheckReason : undefined,
      isLateEntry
    );

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to record temperature.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Record Bedside Temperature</h3>
              <p className="text-xs text-slate-500">
                Bed <strong className="text-emerald-800">{patient.bed}</strong> — {patient.name} ({patient.age}y)
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Duplicate Reading Warning */}
          {hasReadingToday && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Duplicate Reading Recorded Today</span>
              </div>
              <p>
                Recorded by <strong>{lastReadingToday.recordedBy}</strong> ({formatTempShort(lastReadingToday.value, 'F')} / {lastReadingToday.value}°C) at{' '}
                {new Date(lastReadingToday.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </p>
              <p className="text-[11px] text-amber-700 font-medium">
                Submitting a second reading requires a recheck reason.
              </p>
            </div>
          )}

          {/* Unit Toggle & Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Temperature Reading
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('F')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    unit === 'F' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  °F
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('C')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    unit === 'C' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  °C
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="80"
                max="120"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-2xl font-bold text-slate-900 focus:outline-none transition-all ${
                  isFever
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : isHardBlock
                    ? 'border-red-600 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                }`}
                placeholder="98.6"
                autoFocus
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold text-base">
                °{unit}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 font-semibold">Quick Presets:</span>
              <button
                type="button"
                onClick={() => { setUnit('F'); setInputValue('98.6'); }}
                className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300 transition-colors"
              >
                98.6°F (Normal)
              </button>
              <button
                type="button"
                onClick={() => { setUnit('F'); setInputValue('100.4'); }}
                className="px-2.5 py-0.5 text-xs bg-red-50 hover:bg-red-100 text-red-800 font-extrabold rounded border border-red-300 transition-colors"
              >
                100.4°F (Fever Threshold)
              </button>
              <button
                type="button"
                onClick={() => { setUnit('F'); setInputValue('101.5'); }}
                className="px-2 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-900 font-extrabold rounded border border-red-300 transition-colors"
              >
                101.5°F (Fever)
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                Equivalent: <strong>{unit === 'F' ? `${valueInCelsius}°C` : `${celsiusToFahrenheit(valueInCelsius)}°F`}</strong>
              </span>
              {isFever && (
                <span className="text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  FEVER DETECTED (≥100.4°F / 38.0°C)
                </span>
              )}
            </div>
          </div>

          {/* Soft Warning */}
          {isSoftWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <p className="text-xs text-amber-800 font-medium">
                ⚠️ Extreme value ({formatTempShort(valueInCelsius, 'F')} / {valueInCelsius}°C). Please verify thermometer accuracy.
              </p>
              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedSoftWarning}
                  onChange={(e) => setConfirmedSoftWarning(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>I confirm this extreme reading is verified correct</span>
              </label>
            </div>
          )}

          {/* Recheck Reason */}
          {hasReadingToday && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recheck Reason *
              </label>
              <input
                type="text"
                value={recheckReason}
                onChange={(e) => setRecheckReason(e.target.value)}
                placeholder="e.g. Patient felt warm, chills reported"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>
          )}

          {/* Late Entry Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lateEntry"
              checked={isLateEntry}
              onChange={(e) => setIsLateEntry(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="lateEntry" className="text-xs text-slate-600 flex items-center gap-1 cursor-pointer">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Late Entry (Reading taken earlier today)
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
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
              Save Temperature
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
