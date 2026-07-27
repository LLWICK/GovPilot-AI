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
    <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl w-full">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
        <span>Procedure Pipeline</span>
      </h3>
      <div className="relative pl-6 space-y-7 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
        {steps.map((step) => {
          let badgeClass = "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500";
          let labelClass = "text-slate-500 dark:text-zinc-500";
          let shadowClass = "";

          if (step.completed) {
            badgeClass = "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500";
            labelClass = "text-slate-700 dark:text-zinc-400 font-medium";
          } else if (step.current) {
            badgeClass = "bg-amber-500 border-amber-400 text-white dark:text-zinc-950";
            labelClass = "text-slate-900 dark:text-white font-bold";
            shadowClass = "shadow-[0_0_15px_rgba(245,158,11,0.3)]";
          }

          return (
            <div key={step.id} className="relative flex gap-5 items-start group">
              {/* Stepper Dot/Badge */}
              <div
                className={`absolute -left-[21px] w-6 h-6 rounded-full border flex items-center justify-center text-xs transition-all duration-300 ${badgeClass} ${shadowClass}`}
              >
                {step.completed ? (
                  <Check className="w-3.5 h-3.5" weight="bold" />
                ) : step.current ? (
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-zinc-950 inline-block"></span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
                )}
              </div>

              {/* Stepper Label */}
              <div className="space-y-1 mt-0.5">
                <p className={`text-sm leading-tight transition-colors ${labelClass}`}>
                  {step.label}
                </p>
                {step.current && (
                  <span className="inline-block text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest mt-1">
                    Active Step
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
