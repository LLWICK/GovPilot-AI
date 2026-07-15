"use client";

import React from "react";
import { CheckCircle, Warning, Spinner, FileText } from "@phosphor-icons/react";

export interface Document {
  id: string;
  name: string;
  status: "processing" | "verified" | "issue";
  note?: string;
}

interface DocumentChecklistProps {
  documents: Document[];
}

export default function DocumentChecklist({ documents }: DocumentChecklistProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm w-full">
      <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary dark:text-amber-500" weight="bold" />
        <span>Document Checklist</span>
      </h3>
      <div className="space-y-3">
        {documents.map((doc) => {
          let statusColor = "bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-450 border-slate-200 dark:border-zinc-850";
          let StatusIcon = FileText;

          if (doc.status === "verified") {
            statusColor = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60";
            StatusIcon = CheckCircle;
          } else if (doc.status === "issue") {
            statusColor = "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-100 dark:border-rose-900/60 animate-pulse";
            StatusIcon = Warning;
          } else if (doc.status === "processing") {
            statusColor = "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/60";
            StatusIcon = Spinner;
          }

          return (
            <div
              key={doc.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${statusColor}`}
            >
              <div className="mt-0.5">
                {doc.status === "processing" ? (
                  <StatusIcon className="w-4 h-4 animate-spin" weight="bold" />
                ) : (
                  <StatusIcon className="w-4 h-4" weight="fill" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{doc.name}</p>
                {doc.note && (
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-normal">
                    {doc.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
