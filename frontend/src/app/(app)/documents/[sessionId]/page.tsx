"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
} from "@phosphor-icons/react";
import AppSidebar from "@/components/AppSidebar";

interface Document {
  id: string;
  name: string;
  status: "pending" | "uploaded" | "processing" | "verified" | "issue";
  note?: string;
}

export default function DocumentChecklistPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = React.use(params);
  const { data: session } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fetch document checklist
  const {
    data: documents,
    isLoading,
  } = useQuery<Document[]>({
    queryKey: ["documents", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/backend/sessions/${sessionId}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

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
              Required Documents Checklist
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              Official civil documents required for your application process.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 rounded-2xl bg-white dark:bg-zinc-900 animate-pulse border border-slate-200 dark:border-zinc-800" />
              <div className="h-20 rounded-2xl bg-white dark:bg-zinc-900 animate-pulse border border-slate-200 dark:border-zinc-800" />
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium text-sm">
              No required documents listed for this session yet.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
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
                        {doc.note && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                            {doc.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                        <CheckCircle className="w-4 h-4" weight="duotone" />
                        <span>Required Document</span>
                      </div>
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
