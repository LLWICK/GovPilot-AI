"use client";

import React from "react";
import { List } from "@phosphor-icons/react";

interface SessionHeaderProps {
  serviceName: string;
  status: string;
  progress: number;
  agencyName?: string;
  onMenuToggle?: () => void;
}

export default function SessionHeader({
  serviceName,
  status,
  progress,
  agencyName,
  onMenuToggle,
}: SessionHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3.5 shadow-sm flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Toggle workflow status drawer"
            >
              <List className="w-6 h-6" weight="bold" />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {serviceName}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
              {agencyName || "Sri Lankan Government Services"}
            </p>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
              status === "Completed"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : status === "Review & Final Confirm" ||
                  status === "Review & Confirm"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>Application Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
