"use client";

import React from "react";
import { Check } from "@phosphor-icons/react";

interface ConfirmationCardProps {
  summary: string;
  action: string;
  onConfirm?: () => void;
}

export default function ConfirmationCard({
  summary,
  action,
  onConfirm,
}: ConfirmationCardProps) {
  // Parse the summary text lines for cleaner structured list rendering
  const lines = summary.split("\n").filter((line) => line.trim() !== "");

  return (
    <div className="bg-white border-2 border-primary-light rounded-xl p-5 shadow-md max-w-md w-full my-2">
      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Review & Confirm Application
      </h4>
      <div className="bg-slate-50 rounded-lg p-4 mb-5 border border-slate-100 space-y-3">
        {lines.map((line, idx) => {
          const parts = line.split(":");
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(":").trim();
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-sm font-semibold text-slate-500">{key}</span>
                <span className="text-sm font-bold text-slate-800 text-right">
                  {value}
                </span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-sm text-slate-700">
              {line}
            </p>
          );
        })}
      </div>
      <button
        onClick={onConfirm}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-lg transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-sm text-base"
      >
        <Check className="w-5 h-5" weight="bold" />
        <span>{action}</span>
      </button>
    </div>
  );
}
