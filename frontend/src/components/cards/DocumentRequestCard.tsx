"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowSquareOut } from "@phosphor-icons/react";

interface DocumentRequestCardProps {
  required: string[];
  sessionId: string;
}

export default function DocumentRequestCard({
  required,
  sessionId,
}: DocumentRequestCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm max-w-full sm:max-w-md w-full my-2">
      <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-amber-500" weight="duotone" />
        <span>Required Documents Checklist</span>
      </h4>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 mb-4">
        The following official civil documents are required for your application:
      </p>
      <ul className="space-y-2.5 mb-5">
        {required.map((doc, idx) => (
          <li
            key={idx}
            className="flex items-center gap-2.5 text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg border border-slate-100 dark:border-zinc-800"
          >
            <FileText
              className="w-5 h-5 text-amber-500 flex-shrink-0"
              weight="duotone"
            />
            <span className="font-semibold text-sm sm:text-base">{doc}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/documents/${sessionId}`}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-light dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold rounded-lg active:scale-[0.98] transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 text-center text-sm sm:text-base"
      >
        <span>View Required Documents</span>
        <ArrowSquareOut className="w-4 h-4" weight="bold" />
      </Link>
    </div>
  );
}
