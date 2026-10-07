'use client';

import React, { useState } from 'react';
import { DEMO_STEPS, DemoStep } from '@/utils/workflowSteps';
import { useFacilityStore } from '@/store/useFacilityStore';
import { CheckCircle2, Circle, ArrowRight, X, BookOpen } from 'lucide-react';

interface DemoGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideDrawer: React.FC<DemoGuideDrawerProps> = ({ isOpen, onClose }) => {
  const { setActiveRole, setActiveView } = useFacilityStore();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleStep = (id: number) => {
    setCompletedSteps(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExecuteStep = (step: DemoStep) => {
    setActiveRole(step.role);
    setActiveView(step.view);
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps(prev => [...prev, step.id]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col text-slate-900">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              Evaluator Demo Checklist
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                {completedSteps.length}/11 Done
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">Step-by-step evaluator click-through guide</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <div
          className="bg-emerald-600 h-full transition-all duration-300"
          style={{ width: `${(completedSteps.length / 11) * 100}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {DEMO_STEPS.map((step) => {
          const isDone = completedSteps.includes(step.id);
          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-lg border transition-all ${
                isDone
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => toggleStep(step.id)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Step {step.id}
                    </span>
                    <span className="text-[11px] font-medium capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {step.role} Role
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold mb-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>

                  <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-2">
                    <div className="text-slate-600 leading-snug">
                      💡 <strong>Action:</strong> {step.instructions}
                    </div>

                    <button
                      onClick={() => handleExecuteStep(step)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors shadow-xs"
                    >
                      <span>Go to Step {step.id} Screen</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <span>Click checkbox to mark step complete</span>
        <button
          onClick={() => setCompletedSteps([])}
          className="text-emerald-700 hover:underline font-semibold"
        >
          Reset Checklist
        </button>
      </div>

    </div>
  );
};
