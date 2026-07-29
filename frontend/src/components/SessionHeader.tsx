import React from "react";
import { List, SidebarSimple } from "@phosphor-icons/react";

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
    <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 py-3 shadow-sm flex flex-col gap-2 w-full flex-shrink-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Toggle workflow status drawer"
            >
              <List className="w-6 h-6" weight="bold" />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              {serviceName}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider">
              {agencyName || "Sri Lankan Government Services"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
              status === "Completed"
                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : status === "Review & Final Confirm" ||
                  status === "Review & Confirm"
                ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {status}
          </span>

          {onSidebarToggle && (
            <button
              type="button"
              onClick={onSidebarToggle}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors focus:outline-none"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <SidebarSimple className="w-4 h-4" weight="bold" />
              <span>{isSidebarOpen ? "Hide Steps" : "Show Steps"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Only rendered when progress > 0) */}
      {progress > 0 && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Application Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary dark:bg-amber-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
