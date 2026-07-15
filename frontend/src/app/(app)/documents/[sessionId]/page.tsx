"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  FileArrowUp,
  CheckCircle,
  Warning,
  Spinner,
  FileText,
  Clock,
  Flask,
} from "@phosphor-icons/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Document {
  id: string;
  name: string;
  status: "processing" | "verified" | "issue";
  note?: string;
}

export default function DocumentUploadPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const queryClient = useQueryClient();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // 1. Fetch document checklist (polls when status is 'processing')
  const {
    data: documents,
    isLoading,
    refetch,
  } = useQuery<Document[]>({
    queryKey: ["documents", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/documents?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs && docs.some((d: any) => d.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });

  // 2. Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ docId, file }: { docId: string; file: File }) => {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("docId", docId);
      formData.append("file", file);

      const res = await fetch("/api/proxy/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh checklist status
      queryClient.invalidateQueries({ queryKey: ["documents", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessionInfo", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["chatHistory", sessionId] });
    },
    onSettled: () => {
      setUploadingDocId(null);
    },
  });

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocId(docId);
    uploadMutation.mutate({ docId, file });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow space-y-6 font-sans">
      
      {/* Return to Chat link */}
      <div>
        <Link
          href={`/chat/${sessionId}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-zinc-500 hover:text-primary dark:hover:text-amber-500 transition-colors focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          <span>Return to Chat Portal</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Document Verification Desk
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-semibold">
          Upload required documents for OCR checking and database verification.
        </p>
      </div>

      {/* Test helper instruction card using shadcn/ui */}
      <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900 text-amber-800 dark:text-amber-200 rounded-2xl flex items-start gap-3 p-4">
        <Flask className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" weight="fill" />
        <div className="space-y-0.5">
          <AlertTitle className="font-extrabold uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-400">
            Developer Test Tip
          </AlertTitle>
          <AlertDescription className="leading-relaxed text-sm font-medium text-amber-850 dark:text-amber-200/90">
            To simulate an OCR validation rejection (e.g. background issues or poor resolution), name your uploaded file to include the word <span className="font-bold underline">error</span> (e.g., <code className="bg-amber-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-amber-900 dark:text-amber-205">nic_error.jpg</code>).
          </AlertDescription>
        </div>
      </Alert>

      {/* Checklist display */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-zinc-900 border border-slate-202 dark:border-zinc-800 p-6 rounded-2xl h-24 animate-pulse"
            ></div>
          ))}
        </div>
      ) : !documents || documents.length === 0 ? (
        <div className="text-center p-8 border border-slate-200 bg-white rounded-2xl">
          No required documents found.
        </div>
      ) : (
        <div className="space-y-6">
          {documents.map((doc) => {
            let containerClass = "border-slate-205 dark:border-zinc-800 bg-white dark:bg-zinc-900";
            let StatusIcon = FileText;
            let statusBadge = "";
            let statusLabel = "";

            if (doc.status === "verified") {
              containerClass = "border-emerald-205 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/5";
              StatusIcon = CheckCircle;
              statusBadge = "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60";
              statusLabel = "Verified";
            } else if (doc.status === "issue") {
              containerClass = "border-rose-205 dark:border-rose-900/60 bg-rose-50/10 dark:bg-rose-955/5";
              StatusIcon = Warning;
              statusBadge = "bg-rose-100 dark:bg-rose-955 text-rose-800 dark:text-rose-455 border-rose-200 dark:border-rose-900/60";
              statusLabel = "Action Required";
            } else if (doc.status === "processing") {
              containerClass = "border-amber-205 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-955/5";
              StatusIcon = Spinner;
              statusBadge = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60";
              statusLabel = "OCR Processing";
            } else {
              statusBadge = "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700";
              statusLabel = "Pending Upload";
            }

            return (
              <div
                key={doc.id}
                className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${containerClass}`}
              >
                
                {/* Info Column */}
                <div className="flex items-start gap-4 flex-grow min-w-0">
                  <div className="mt-1">
                    {doc.status === "processing" ? (
                      <StatusIcon
                        className="w-6 h-6 text-amber-600 animate-spin"
                        weight="bold"
                      />
                    ) : doc.status === "verified" ? (
                      <StatusIcon className="w-6 h-6 text-emerald-600" weight="fill" />
                    ) : doc.status === "issue" ? (
                      <StatusIcon className="w-6 h-6 text-rose-600" weight="fill" />
                    ) : (
                      <FileText className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {doc.name}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {doc.note ? (
                      <p className="text-sm text-slate-655 dark:text-zinc-300 leading-normal bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 p-3 rounded-lg mt-2">
                        {doc.note}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        {doc.status === "processing"
                          ? "Autopolls OCR state every few seconds."
                          : "Upload a JPG, PNG, or PDF file."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Upload Action Column */}
                <div className="flex-shrink-0">
                  {doc.status === "verified" ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                      <CheckCircle className="w-4 h-4" weight="bold" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <label className="relative flex items-center justify-center gap-2 h-12 px-6 bg-primary dark:bg-zinc-800 hover:bg-primary-light dark:hover:bg-zinc-700 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm focus-within:ring-2 focus-within:ring-primary dark:focus-within:ring-zinc-700 focus-within:ring-offset-2">
                      {uploadingDocId === doc.id ? (
                        <Spinner className="w-4 h-4 animate-spin" weight="bold" />
                      ) : (
                        <FileArrowUp className="w-4 h-4" weight="bold" />
                      )}
                      <span>
                        {uploadingDocId === doc.id
                          ? "Uploading..."
                          : doc.status === "issue"
                          ? "Re-upload File"
                          : "Choose File"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={uploadingDocId !== null}
                        onChange={(e) => handleFileChange(doc.id, e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ fontSize: 0 }} // avoid visual file input styling
                      />
                    </label>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
