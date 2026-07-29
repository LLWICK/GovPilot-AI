"use client";

import React from "react";
import { CheckCircle, Circle, ArrowRight } from "@phosphor-icons/react";

export interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface StepPlanCardProps {
  steps: Step[];
}

export default function StepPlanCard({ steps }: StepPlanCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm max-w-full sm:max-w-md w-full my-2">
      <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Application Step Plan
      </h4>
      <div className="space-y-4">
        {steps.map((step) => {
          let Icon = Circle;
          let iconColor = "text-slate-300 dark:text-zinc-600";
          let labelClass = "text-slate-400 dark:text-zinc-500";
          let bgClass = "bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850";

          if (step.completed) {
            Icon = CheckCircle;
            iconColor = "text-emerald-600 dark:text-emerald-400";
            labelClass = "text-slate-600 dark:text-zinc-400 font-medium line-through decoration-slate-300 dark:decoration-zinc-700";
            bgClass = "bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60";
          } else if (step.current) {
            Icon = ArrowRight;
            iconColor = "text-amber-600 dark:text-amber-400 animate-pulse";
            labelClass = "text-slate-900 dark:text-zinc-100 font-bold";
            bgClass = "bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-700 ring-2 ring-amber-100 dark:ring-amber-950";
          }

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${bgClass}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} weight="bold" />
              <span className={`text-sm sm:text-base ${labelClass}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
