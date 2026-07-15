"use client";

import React from "react";
import { Check } from "@phosphor-icons/react";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface WorkflowTrackerProps {
  steps: Step[];
}

export default function WorkflowTracker({ steps }: WorkflowTrackerProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm w-full">
      <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-primary dark:bg-amber-500 inline-block"></span>
        <span>Renewal Steps Tracker</span>
      </h3>
      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
        {steps.map((step) => {
          let badgeClass = "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-750 text-slate-400 dark:text-zinc-500";
          let labelClass = "text-slate-400 dark:text-zinc-550";

          if (step.completed) {
            badgeClass = "bg-emerald-100 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400";
            labelClass = "text-slate-650 dark:text-zinc-400 font-medium";
          } else if (step.current) {
            badgeClass = "bg-amber-100 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300 ring-2 ring-amber-200 dark:ring-amber-950 ring-offset-1 dark:ring-offset-zinc-900";
            labelClass = "text-slate-900 dark:text-white font-bold";
          }

          return (
            <div key={step.id} className="relative flex gap-4 items-start">
              {/* Stepper Dot/Badge */}
              <div
                className={`absolute -left-[21px] w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${badgeClass}`}
              >
                {step.completed ? (
                  <Check className="w-3.5 h-3.5" weight="bold" />
                ) : step.current ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse inline-block"></span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
                )}
              </div>

              {/* Stepper Label */}
              <div className="space-y-0.5">
                <p className={`text-sm leading-tight transition-colors ${labelClass}`}>
                  {step.label}
                </p>
                {step.current && (
                  <span className="inline-block text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 uppercase tracking-wider">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
