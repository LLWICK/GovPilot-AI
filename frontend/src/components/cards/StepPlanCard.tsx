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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-md w-full my-2">
      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Application Step Plan
      </h4>
      <div className="space-y-4">
        {steps.map((step) => {
          let Icon = Circle;
          let iconColor = "text-slate-300";
          let labelClass = "text-slate-400";
          let bgClass = "bg-slate-50";

          if (step.completed) {
            Icon = CheckCircle;
            iconColor = "text-emerald-600";
            labelClass = "text-slate-600 font-medium line-through decoration-slate-300";
            bgClass = "bg-emerald-50/50 border border-emerald-100";
          } else if (step.current) {
            Icon = ArrowRight;
            iconColor = "text-amber-600 animate-pulse";
            labelClass = "text-slate-900 font-bold";
            bgClass = "bg-amber-50 border-2 border-amber-200 ring-2 ring-amber-100 ring-offset-1";
          } else {
            bgClass = "bg-slate-50 border border-slate-100";
          }

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${bgClass}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} weight="bold" />
              <span className={`text-base ${labelClass}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
