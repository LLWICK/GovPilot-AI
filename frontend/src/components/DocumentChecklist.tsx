"use client";

import React from "react";
import { CheckCircle, Warning, Spinner, FileText } from "@phosphor-icons/react";

export interface Document {
  id: string;
  name: string;
  status: "pending" | "uploaded" | "processing" | "verified" | "issue";
  note?: string;
}

interface DocumentChecklistProps {
  documents: Document[];
}

export default function DocumentChecklist({ documents }: DocumentChecklistProps) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl w-full">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
        <FileText className="w-5 h-5 text-amber-500" weight="duotone" />
        <span>Document Verification</span>
      </h3>
      <div className="space-y-4">
        {documents.map((doc) => {
          let statusColor = "bg-slate-50 dark:bg-zinc-950/50 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800/80";
          let StatusIcon = FileText;

          if (doc.status === "verified") {
            statusColor = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
            StatusIcon = CheckCircle;
          } else if (doc.status === "issue") {
            statusColor = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
            StatusIcon = Warning;
          } else if (doc.status === "processing") {
            statusColor = "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
            StatusIcon = Spinner;
          }

          return (
            <div
              key={doc.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${statusColor} ${doc.status === 'issue' ? 'shadow-[0_0_15px_rgba(243,118,140,0.1)]' : ''}`}
            >
              <div className="mt-0.5">
                {doc.status === "processing" ? (
                  <StatusIcon className="w-5 h-5 animate-spin" weight="bold" />
                ) : (
                  <StatusIcon className="w-5 h-5" weight={doc.status === 'verified' ? 'fill' : 'duotone'} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{doc.name}</p>
                {doc.note && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed font-medium">
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
