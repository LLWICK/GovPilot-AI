"use client";

import React from "react";
import { List, SidebarSimple, Bank } from "@phosphor-icons/react";
import Link from "next/link";

interface SessionHeaderProps {
  serviceName: string;
  status: string;
  progress: number;
  agencyName?: string;
  onMenuToggle?: () => void;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function SessionHeader({
  serviceName,
  status,
  progress,
  agencyName,
  onMenuToggle,
  onSidebarToggle,
  isSidebarOpen = true,
}: SessionHeaderProps) {
  return (
    <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200/20 dark:border-zinc-900/40 px-4 sm:px-6 py-3 flex flex-col gap-2.5 w-full flex-shrink-0 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-1.5 rounded border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 focus:outline-none"
              aria-label="Toggle workflow status drawer"
            >
              <List className="w-4 h-4" weight="bold" />
            </button>
          )}

          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Bank className="w-4.5 h-4.5" weight="fill" />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {serviceName}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
              {agencyName || "GOVERNMENT OF SRI LANKA"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onSidebarToggle && (
            <button
              type="button"
              onClick={onSidebarToggle}
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all bg-white dark:bg-zinc-950/40 focus:outline-none"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <SidebarSimple className="w-3.5 h-3.5" weight="bold" />
              <span>{isSidebarOpen ? "Hide Steps" : "Show Steps"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Only rendered when progress > 0) */}
      {progress > 0 && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
            <span>Application Progress</span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden border border-slate-200/40 dark:border-zinc-800/40">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
