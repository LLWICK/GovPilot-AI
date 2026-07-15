"use client";

import React from "react";
import Link from "next/link";
import { FileArrowUp, ArrowSquareOut } from "@phosphor-icons/react";

interface DocumentRequestCardProps {
  required: string[];
  sessionId: string;
}

export default function DocumentRequestCard({
  required,
  sessionId,
}: DocumentRequestCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-md w-full my-2">
      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Action Required: Upload Documents
      </h4>
      <p className="text-sm text-slate-600 mb-4">
        Please upload the following required documents for OCR checking:
      </p>
      <ul className="space-y-2.5 mb-5">
        {required.map((doc, idx) => (
          <li
            key={idx}
            className="flex items-center gap-2.5 text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100"
          >
            <FileArrowUp
              className="w-5 h-5 text-primary-light flex-shrink-0"
              weight="duotone"
            />
            <span className="font-semibold text-base">{doc}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/documents/${sessionId}`}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light active:scale-[0.98] transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 text-center"
      >
        <span>Go to Document Upload</span>
        <ArrowSquareOut className="w-4 h-4" weight="bold" />
      </Link>
    </div>
  );
}
