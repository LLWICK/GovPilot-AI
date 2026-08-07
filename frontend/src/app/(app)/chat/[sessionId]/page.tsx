"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useChatStream } from "@/hooks/useChatStream";
import AppSidebar from "@/components/AppSidebar";
import WorkflowTracker from "@/components/WorkflowTracker";
import DocumentChecklist, { Document } from "@/components/DocumentChecklist";
import StructuredCard, { CardProps } from "@/components/cards/StructuredCard";
import {
  PaperPlaneTilt,
  Paperclip,
  Spinner,
  Bank,
  User,
  X,
  Sparkle,
  SidebarSimple,
  Notebook,
  IdentificationCard,
  FileText,
  Question,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { MessageContent } from "@/components/ui/message";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  cards?: CardProps[];
  timestamp: string;
}

interface SessionInfo {
  sessionId: string;
  serviceName: string;
  agencyName: string;
  status: string;
  progress: number;
  steps: { id: string; label: string; completed: boolean; current: boolean }[];
}

export default function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = React.use(params);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SSE stream state hook
  const {
    isStreaming,
    streamText,
    streamCards,
    startStream,
  } = useChatStream();

  // 1. Fetch Session Info
  const { data: sessionInfo, refetch: refetchSession } = useQuery<SessionInfo>({
    queryKey: ["sessionInfo", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/backend/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session metadata");
      return res.json();
    },
  });

  // 2. Fetch Chat History
  const { data: chatHistory, refetch: refetchChat } = useQuery<Message[]>({
    queryKey: ["chatHistory", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/backend/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch chat history");
      return res.json();
    },
  });

  // 3. Fetch Document Checklists & Poll while OCR status is "processing"
  const { data: documents, refetch: refetchDocs } = useQuery<Document[]>({
    queryKey: ["documents", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/backend/sessions/${sessionId}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs && docs.some((d: any) => d.status === "processing")) {
        return 2500;
      }
      return false;
    },
  });

  useEffect(() => {
    if (documents) {
      refetchSession();
      refetchChat();
    }
  }, [documents, refetchSession, refetchChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamText]);

  // Calculate progress dynamically based on completed steps in sessionInfo
  const calculatedProgress = React.useMemo(() => {
    if (sessionInfo?.steps && sessionInfo.steps.length > 0) {
      const completedCount = sessionInfo.steps.filter((s) => s.completed).length;
      return Math.round((completedCount / sessionInfo.steps.length) * 100);
    }
    return sessionInfo?.progress ?? 0;
  }, [sessionInfo]);

  // Submit Message handler (Optimistically appends user message instantly)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsgText = text;
    setInputText("");

    // Optimistically insert user message immediately into React Query cache
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    queryClient.setQueryData<Message[]>(["chatHistory", sessionId], (old = []) => [
      ...(old || []),
      userMessage,
    ]);

    setTimeout(() => {
      scrollToBottom();
    }, 10);

    // Trigger SSE stream connection
    await startStream(userMsgText, sessionId, () => {
      // Stream complete callback: Synchronize query cache
      refetchChat();
      refetchSession();
      refetchDocs();
    });
  };

  const handleFinalConfirm = () => {
    handleSendMessage("Submit Final Application");
  };

  return (
    <div className="flex w-full h-dvh overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-sans transition-colors duration-200">
      
      {/* GEMINI LEFT COLLAPSIBLE SIDEBAR */}
      <div className="hidden md:flex flex-shrink-0 h-full z-30">
        <AppSidebar
          userName={session?.user?.name || "Citizen"}
          steps={sessionInfo?.steps}
          documents={documents}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* MAIN CHAT WORKSPACE */}
      <div className="flex-1 flex flex-col justify-between h-full bg-transparent relative z-10 min-w-0 overflow-hidden">
        
        {/* Rich Ambient Radial Glow & Dot Matrix Layer (Gray halo in light mode, Amber glow in dark mode) */}
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-slate-500/20 dark:bg-amber-500/12 blur-[140px] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.25px,transparent_1.25px)] dark:bg-[radial-gradient(#3f3f46_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none opacity-60 dark:opacity-40 z-0" />

        {/* Top Minimalist Header Bar */}
        <div className="flex-shrink-0 px-4 sm:px-6 h-16 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none"
              aria-label="Open mobile status drawer"
            >
              <SidebarSimple className="w-5 h-5" weight="bold" />
            </button>

            {/* Model/Dispatcher Selector Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm font-extrabold shadow-sm">
              <span>GovPilot</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <span className="inline-flex items-center text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 uppercase tracking-wider">
              {sessionInfo?.status || "Ready"}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar (If active) */}
        {calculatedProgress > 0 && (
          <div className="w-full bg-slate-100 dark:bg-zinc-900/60 px-6 py-1.5 border-b border-slate-200/40 dark:border-zinc-800/40 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 z-10">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Application Progress
            </span>
            <span className="text-amber-600 dark:text-amber-400">{calculatedProgress}%</span>
          </div>
        )}

        {/* Stream Canvas & Welcome Suggestions Grid */}
        <div className="flex-grow overflow-y-auto scroll-smooth px-4 sm:px-8 py-6 space-y-8 custom-scrollbar max-w-4xl mx-auto w-full z-10">
          
          {/* Welcome Hero Greeting & Prompt Suggestions Grid (Shown on new session or when few messages) */}
          {(!chatHistory || chatHistory.length <= 1) && !isStreaming && (
            <div className="py-6 sm:py-10 space-y-8 max-w-3xl mx-auto animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
                    Hello, {session?.user?.name ? session.user.name.split(" ")[0] : "Citizen"}
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 font-medium">
                  How can I assist you with Sri Lankan civil services today?
                </p>
              </div>

              {/* Suggestion Cards Grid (Supports BOTH Light & Dark Themes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendMessage("How do I apply to renew my passport?")}
                  className="p-4 rounded-2xl text-left bg-white/90 hover:bg-white dark:bg-zinc-900/70 dark:hover:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all duration-200 group active:scale-[0.98] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Notebook className="w-4.5 h-4.5" weight="duotone" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Renew Passport
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Check required documents & submit your passport for instant OCR verification.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage("How do I request a new National Identity Card (NIC)?")}
                  className="p-4 rounded-2xl text-left bg-white/90 hover:bg-white dark:bg-zinc-900/70 dark:hover:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all duration-200 group active:scale-[0.98] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <IdentificationCard className="w-4.5 h-4.5" weight="duotone" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      National Identity Card
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Request replacement NIC and verify Grama Niladhari residency certificate.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage("How do I get a certified copy of my birth certificate?")}
                  className="p-4 rounded-2xl text-left bg-white/90 hover:bg-white dark:bg-zinc-900/70 dark:hover:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all duration-200 group active:scale-[0.98] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-4.5 h-4.5" weight="duotone" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Birth Certificate Copy
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Request duplicate copy from Registrar General department archives.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage("What government services can I get through GovPilot AI?")}
                  className="p-4 rounded-2xl text-left bg-white/90 hover:bg-white dark:bg-zinc-900/70 dark:hover:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all duration-200 group active:scale-[0.98] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Question className="w-4.5 h-4.5" weight="duotone" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      General Inquiry
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Ask central dispatcher about fees, processing times, and eligibility.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Chat Message List */}
          {(() => {
            const firstAgentMsgIndex = chatHistory?.findIndex((m) => m.sender === "agent");
            const hasAgentMessage = firstAgentMsgIndex !== undefined && firstAgentMsgIndex !== -1;

            return (
              <>
                {chatHistory?.map((msg, index) => (
                  <div key={msg.id} className="w-full">
                    {msg.sender === "user" ? (
                      <div className="flex justify-end items-start gap-3 ml-auto max-w-[85%] sm:max-w-[75%]">
                        <div className="bg-slate-200/90 dark:bg-zinc-800/90 backdrop-blur-sm text-slate-900 dark:text-zinc-100 rounded-3xl px-5 py-3.5 text-sm sm:text-base leading-relaxed font-normal shadow-sm border-0">
                          {msg.text}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-amber-600 dark:bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm mt-0.5">
                          <User className="w-4 h-4" weight="bold" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-start w-full">
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                          <Bank className="w-4 h-4" weight="fill" />
                        </div>
                        <div className="space-y-4 flex-1 min-w-0 pt-0.5">
                          <div className="text-slate-800 dark:text-zinc-200 text-sm sm:text-base leading-relaxed font-normal space-y-2">
                            <MessageContent markdown={true} className="prose dark:prose-invert max-w-none">
                              {msg.text}
                            </MessageContent>
                          </div>

                          {/* Only render structured cards for the initial agent response, not on follow-up replies */}
                          {msg.cards && msg.cards.length > 0 && index === firstAgentMsgIndex && (
                            <div className="space-y-3 w-full pt-2">
                              {msg.cards.map((card, idx) => (
                                <StructuredCard
                                  key={idx}
                                  card={card}
                                  sessionId={sessionId}
                                  onConfirm={handleFinalConfirm}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* SSE Stream Active Response */}
                {isStreaming && (
                  <div className="flex gap-4 items-start w-full animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm animate-pulse">
                      <Sparkle className="w-4.5 h-4.5" weight="fill" />
                    </div>
                    <div className="space-y-4 flex-1 min-w-0 pt-0.5">
                      <div className="text-slate-800 dark:text-zinc-200 text-sm sm:text-base leading-relaxed font-normal">
                        {streamText === "" ? (
                          <span className="text-slate-400 dark:text-zinc-500 italic animate-pulse">
                            GovPilot AI is thinking...
                          </span>
                        ) : (
                          <MessageContent markdown={true} className="prose dark:prose-invert max-w-none">
                            {streamText}
                          </MessageContent>
                        )}
                      </div>

                      {streamCards && streamCards.length > 0 && !hasAgentMessage && (
                        <div className="space-y-3 w-full pt-2">
                          {streamCards.map((card, idx) => (
                            <StructuredCard
                              key={idx}
                              card={card}
                              sessionId={sessionId}
                              onConfirm={handleFinalConfirm}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Floating Input Capsule */}
        <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-4 pb-3 pt-2 z-20">
          <PromptInput
            value={inputText}
            onValueChange={setInputText}
            onSubmit={() => handleSendMessage(inputText)}
            disabled={isStreaming}
            className="relative flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] transition-all duration-200 focus-within:border-amber-500/60 dark:focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30"
          >
            <PromptInputTextarea
              placeholder="Ask GovPilot AI anything about Sri Lankan civil services..."
              disabled={isStreaming}
              className="w-full text-sm sm:text-base text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 min-h-[40px] max-h-[140px] py-1 px-2 border-none bg-transparent focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-zinc-800/60 mt-1.5 px-1">
              <button
                type="button"
                onClick={() => handleSendMessage(inputText)}
                disabled={isStreaming || !inputText.trim()}
                className="w-9 h-9 rounded-full bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-950 flex items-center justify-center transition-all disabled:opacity-30 disabled:bg-slate-300 dark:disabled:bg-zinc-800 active:scale-95 shadow-sm"
                title="Send Message"
              >
                {isStreaming ? (
                  <Spinner className="w-4 h-4 animate-spin" weight="bold" />
                ) : (
                  <PaperPlaneTilt className="w-4 h-4" weight="fill" />
                )}
              </button>
            </div>
          </PromptInput>

          <p className="text-[11px] text-center text-slate-400 dark:text-zinc-500 pt-2 font-normal">
            GovPilot AI can make mistakes. Verify critical guidance with official civil registers.
          </p>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 z-50 md:hidden flex justify-start backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-full bg-white dark:bg-zinc-950 h-full shadow-2xl p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 border-r border-slate-200 dark:border-zinc-800/80">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800/80">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                GovPilot AI Navigation
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white focus:outline-none transition-colors"
              >
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <Link
              href="/chat/new"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold rounded-2xl text-xs sm:text-sm"
              onClick={() => setIsDrawerOpen(false)}
            >
              Start New Application
            </Link>

            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-amber-500 py-2 border-b border-slate-100 dark:border-zinc-800"
              onClick={() => setIsDrawerOpen(false)}
            >
              My Applications
            </Link>

            {sessionInfo?.steps && <WorkflowTracker steps={sessionInfo.steps} />}
            {documents && <DocumentChecklist documents={documents} />}
          </div>
        </div>
      )}
    </div>
  );
}
