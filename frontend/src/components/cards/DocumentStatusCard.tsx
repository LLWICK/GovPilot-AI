"use client";

import React from "react";
import { CheckCircle, Warning, Spinner } from "@phosphor-icons/react";

interface DocumentStatusCardProps {
  doc: string;
  status: "processing" | "verified" | "issue";
  note?: string;
}

export default function DocumentStatusCard({
  doc,
  status,
  note,
}: DocumentStatusCardProps) {
  let cardClass = "";
  let iconColor = "";
  let titleColor = "";
  let StatusIcon = CheckCircle;
  let label = "";

  switch (status) {
    case "verified":
      cardClass = "border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200";
      iconColor = "text-emerald-600 dark:text-emerald-400";
      titleColor = "text-emerald-800 dark:text-emerald-300";
      StatusIcon = CheckCircle;
      label = "Verified Successfully";
      break;
    case "issue":
      cardClass = "border-rose-200 dark:border-rose-900/80 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
      iconColor = "text-rose-600 dark:text-rose-400";
      titleColor = "text-rose-800 dark:text-rose-300";
      StatusIcon = Warning;
      label = "Verification Issue";
      break;
    case "processing":
    default:
      cardClass = "border-amber-200 dark:border-amber-900/80 bg-amber-50/30 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200";
      iconColor = "text-amber-600 dark:text-amber-400";
      titleColor = "text-amber-800 dark:text-amber-300";
      StatusIcon = Spinner;
      label = "Processing OCR Check...";
      break;
  }

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm max-w-full sm:max-w-md w-full my-2 transition-all duration-300 ${cardClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {status === "processing" ? (
            <StatusIcon
              className={`w-5 h-5 flex-shrink-0 animate-spin ${iconColor}`}
              weight="bold"
            />
          ) : (
            <StatusIcon
              className={`w-5 h-5 flex-shrink-0 ${iconColor}`}
              weight="fill"
            />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-center">
            <h5 className="font-bold text-sm sm:text-base text-slate-900 dark:text-zinc-100">{doc}</h5>
            <span className={`text-[10px] sm:text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
              status === "verified" ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300" :
              status === "issue" ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300" :
              "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
            }`}>
              {status}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</p>
          {note && <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 mt-2 bg-white/70 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 font-normal">{note}</p>}
        </div>
      </div>
    </div>
  );
}
