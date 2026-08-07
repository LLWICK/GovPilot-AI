"use client";

import React from "react";
import { ListNumbers } from "@phosphor-icons/react";

export interface Step {
  id: string;
  label: string;
  completed?: boolean;
  current?: boolean;
}

interface StepPlanCardProps {
  steps: Step[];
}

export default function StepPlanCard({ steps }: StepPlanCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm max-w-full sm:max-w-md w-full my-2">
      <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <ListNumbers className="w-4 h-4 text-amber-500" weight="duotone" />
        <span>Application Steps</span>
      </h4>
      <div className="space-y-2.5">
        {steps.map((step, index) => (
          <div
            key={step.id || index}
            className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-extrabold flex items-center justify-center shrink-0">
              {index + 1}
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-zinc-100">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
