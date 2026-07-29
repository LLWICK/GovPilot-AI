"use client";

import React, { useState } from "react";
import { Check, CaretDown, CaretUp } from "@phosphor-icons/react";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface WorkflowTrackerProps {
  steps: Step[];
  initialCollapsed?: boolean;
}

export default function WorkflowTracker({
  steps,
  initialCollapsed = false,
}: WorkflowTrackerProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-sm w-full transition-all">
      {/* Minimizable Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary dark:bg-amber-500 inline-block"></span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-amber-400 transition-colors">
            Renewal Steps Tracker
          </h3>
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
            {completedCount}/{steps.length}
          </span>
        </div>
        <button
          type="button"
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 transition-colors focus:outline-none"
          aria-label={isCollapsed ? "Expand workflow tracker" : "Collapse workflow tracker"}
        >
          {isCollapsed ? (
            <CaretDown className="w-4 h-4" weight="bold" />
          ) : (
            <CaretUp className="w-4 h-4" weight="bold" />
          )}
        </button>
      </div>

      {/* Stepper Body */}
      {!isCollapsed && (
        <div className="relative mt-3.5 space-y-3.5 before:content-[''] before:absolute before:left-[9px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
          {steps.map((step) => {
            let badgeClass =
              "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-750 text-slate-400 dark:text-zinc-500";
            let labelClass = "text-slate-400 dark:text-zinc-500";

            if (step.completed) {
              badgeClass =
                "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400";
              labelClass = "text-slate-650 dark:text-zinc-300 font-medium";
            } else if (step.current) {
              badgeClass =
                "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-2 ring-amber-200 dark:ring-amber-950 ring-offset-1 dark:ring-offset-zinc-900";
              labelClass = "text-slate-900 dark:text-white font-bold";
            }

            return (
              <div key={step.id} className="relative flex gap-3 items-start">
                {/* Stepper Dot/Badge */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-all flex-shrink-0 z-10 ${badgeClass}`}
                >
                  {step.completed ? (
                    <Check className="w-3 h-3" weight="bold" />
                  ) : step.current ? (
                    <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse inline-block"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
                  )}
                </div>

                {/* Stepper Label */}
                <div className="space-y-0.5 flex-1 min-w-0 pt-0.5">
                  <p className={`text-xs sm:text-sm leading-snug transition-colors ${labelClass}`}>
                    {step.label}
                  </p>
                  {step.current && !step.completed && (
                    <span className="inline-block text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 uppercase tracking-wider">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
