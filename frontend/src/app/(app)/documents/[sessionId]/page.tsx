"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  FileArrowUp,
  CheckCircle,
  Warning,
  Spinner,
  FileText,
} from "@phosphor-icons/react";
import AppSidebar from "@/components/AppSidebar";

interface Document {
  id: string;
  name: string;
  status: "pending" | "uploaded" | "processing" | "verified" | "issue";
  note?: string;
}

export default function DocumentUploadPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = React.use(params);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 1. Fetch document checklist (polls when status is 'processing')
  const {
    data: documents,
    isLoading,
    refetch,
  } = useQuery<Document[]>({
    queryKey: ["documents", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/backend/sessions/${sessionId}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs && docs.some((d) => d.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });

  // 2. Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ docId, file }: { docId: string; file: File }) => {
      setUploadingDocId(docId);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/backend/sessions/${sessionId}/documents/${docId}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setUploadingDocId(null);
      queryClient.invalidateQueries({ queryKey: ["documents", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessionInfo", sessionId] });
      refetch();
    },
    onError: (err: any) => {
      setUploadingDocId(null);
      alert(`Upload error: ${err.message}`);
    },
  });

  const handleFileChange = (
    docId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ docId, file });
    }
  };

  return (
    <div className="flex w-full h-dvh overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-sans">
      
      {/* GEMINI LEFT COLLAPSIBLE SIDEBAR */}
      <div className="hidden md:flex flex-shrink-0 h-full z-30">
        <AppSidebar
          userName={session?.user?.name || "Citizen"}
          documents={documents}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth custom-scrollbar z-10 min-w-0 p-6 md:p-10">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <Link
            href={`/chat/${sessionId}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat Session
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Required Document Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              Upload your official civil documents for automated AI OCR verification.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 rounded-2xl bg-white dark:bg-zinc-900 animate-pulse border border-slate-200 dark:border-zinc-800" />
              <div className="h-20 rounded-2xl bg-white dark:bg-zinc-900 animate-pulse border border-slate-200 dark:border-zinc-800" />
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium text-sm">
              No verification documents required for this session yet.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const isUploading = uploadingDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" weight="duotone" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              doc.status === "verified"
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : doc.status === "issue"
                                ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                : doc.status === "processing"
                                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse"
                                : doc.status === "uploaded"
                                ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
                            }`}
                          >
                            {doc.status}
                          </span>
                          {doc.note && (
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                              {doc.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {doc.status === "verified" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                          <CheckCircle className="w-4 h-4" weight="fill" />
                          <span>Verified</span>
                        </div>
                      ) : isUploading || doc.status === "processing" ? (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                          <Spinner className="w-4 h-4 animate-spin" weight="bold" />
                          <span>Processing OCR...</span>
                        </div>
                      ) : (
                        <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm active:scale-95">
                          <FileArrowUp className="w-4 h-4" weight="bold" />
                          <span>{doc.status === "uploaded" ? "Re-upload" : "Upload File"}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(doc.id, e)}
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
      </div>
    </div>
  );
}
