"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bank,
  Plus,
  SquaresFour,
  SidebarSimple,
  User,
  SignOut,
} from "@phosphor-icons/react";
import { signOut } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import WorkflowTracker from "@/components/WorkflowTracker";
import DocumentChecklist, { Document } from "@/components/DocumentChecklist";

interface AppSidebarProps {
  userName?: string | null;
  steps?: { id: string; label: string; completed: boolean; current: boolean }[];
  documents?: Document[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AppSidebar({
  userName = "Citizen",
  steps,
  documents,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isCollapsed =
    controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(!internalIsCollapsed);
    }
  };

  return (
    <aside
      className={`flex-shrink-0 h-dvh bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col justify-between z-40 transition-all duration-300 ease-out select-none ${
        isCollapsed ? "w-16" : "w-72 sm:w-80"
      }`}
    >
      {/* TOP HEADER & NAVIGATION */}
      <div className="flex flex-col flex-grow min-h-0">
        
        {/* Header Row (Hamburger + Logo) */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={handleToggle}
            className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all focus:outline-none"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarSimple className="w-5 h-5" weight="bold" />
          </button>

          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 mr-auto ml-1 group">
              <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0 shadow-sm">
                <Bank className="w-4 h-4 text-amber-500" weight="fill" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block whitespace-nowrap">
                GovPilot AI
              </span>
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 uppercase tracking-wider">
                PORTAL
              </span>
            </Link>
          )}
        </div>

        {/* CTA: Start New Application */}
        <div className="p-3">
          <Link
            href="/chat/new"
            className={`w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold rounded-2xl transition-all shadow-sm active:scale-95 ${
              isCollapsed ? "h-10 px-0" : "h-11 px-4 text-xs sm:text-sm"
            }`}
            title="Start New Application"
          >
            <Plus className="w-4 h-4" weight="bold" />
            {!isCollapsed && <span>New Application</span>}
          </Link>
        </div>

        {/* Primary Nav Items */}
        <div className="px-3 py-1 space-y-1 border-b border-slate-100 dark:border-zinc-800/60">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pathname === "/dashboard"
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
            title="My Applications"
          >
            <SquaresFour className="w-5 h-5 shrink-0" weight={pathname === "/dashboard" ? "fill" : "bold"} />
            {!isCollapsed && <span>My Applications</span>}
          </Link>
        </div>

        {/* Dynamic Workflow & Document Checklists Container (Scrollable) */}
        {!isCollapsed ? (
          <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {steps && steps.length > 0 && <WorkflowTracker steps={steps} />}
            {documents && documents.length > 0 && <DocumentChecklist documents={documents} />}
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center py-4 space-y-4">
            {steps && (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Active Workflow" />
            )}
          </div>
        )}
      </div>

      {/* FOOTER USER PROFILE & SETTINGS */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800/60">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-950/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm">
                <User className="w-4 h-4" weight="bold" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 block truncate leading-tight">
                  {userName || "Citizen"}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">
                  CITIZEN ACCOUNT
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign Out"
              >
                <SignOut className="w-4 h-4" weight="bold" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <SignOut className="w-4 h-4" weight="bold" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
