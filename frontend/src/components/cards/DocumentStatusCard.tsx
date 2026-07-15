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
      cardClass = "border-emerald-200 bg-emerald-50/40 text-emerald-900";
      iconColor = "text-emerald-600";
      titleColor = "text-emerald-800";
      StatusIcon = CheckCircle;
      label = "Verified Successfully";
      break;
    case "issue":
      cardClass = "border-rose-200 bg-rose-50/50 text-rose-900";
      iconColor = "text-rose-600";
      titleColor = "text-rose-800";
      StatusIcon = Warning;
      label = "Verification Issue";
      break;
    case "processing":
    default:
      cardClass = "border-amber-200 bg-amber-50/30 text-amber-900";
      iconColor = "text-amber-600";
      titleColor = "text-amber-800";
      StatusIcon = Spinner;
      label = "Processing OCR Check...";
      break;
  }

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm max-w-md w-full my-2 transition-all duration-300 ${cardClass}`}
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
            <h5 className="font-bold text-base text-slate-900">{doc}</h5>
            <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
              status === "verified" ? "bg-emerald-100 text-emerald-800" :
              status === "issue" ? "bg-rose-100 text-rose-800" :
              "bg-amber-100 text-amber-800"
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {note && <p className="text-sm text-slate-700 mt-2 bg-white/70 p-2.5 rounded-lg border border-slate-100 font-normal">{note}</p>}
        </div>
      </div>
    </div>
  );
}
