"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatStream } from "@/hooks/useChatStream";
import SessionHeader from "@/components/SessionHeader";
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
  FileText,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import {
  Message as PKMessage,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import { motion, AnimatePresence } from "framer-motion";

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
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInputText("");

    await startStream(text, sessionId, () => {
      refetchChat();
      refetchSession();
      refetchDocs();
    });
  };

  const handleFinalConfirm = () => {
    handleSendMessage("Submit Final Application");
  };

  return (
    <div className="flex-grow flex h-[calc(100dvh-64px)] relative overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-sans selection:bg-amber-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />

      {/* LEFT CHAT PANEL */}
      <div className="flex-grow flex flex-col justify-between h-full bg-transparent relative z-10">
        
        <SessionHeader
          serviceName={sessionInfo?.serviceName || "GovPilot AI Portal"}
          status={sessionInfo?.status ?? "Loading application..."}
          progress={sessionInfo?.progress ?? 0}
          agencyName={sessionInfo?.agencyName}
          onMenuToggle={() => setIsDrawerOpen(true)}
        />

        {/* Message List */}
        <div className="flex-grow overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
          <AnimatePresence>
            {chatHistory?.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto" : ""
                }`}
              >
                <PKMessage
                  className={`${
                    msg.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar Icon */}
                  <MessageAvatar
                    src=""
                    alt={msg.sender === "user" ? "User" : "Agent"}
                    fallback={
                      msg.sender === "user" ? (
                        <User className="w-5 h-5 text-zinc-950" weight="bold" />
                      ) : (
                        <Bank className="w-5 h-5 text-amber-500" weight="fill" />
                      )
                    }
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl border border-slate-200 dark:border-zinc-700/50 ${
                      msg.sender === "user" ? "bg-amber-500" : "bg-white dark:bg-zinc-800"
                    }`}
                  />

                  {/* Message Bubble */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <MessageContent
                      markdown={msg.sender === "agent"}
                      className={`p-5 rounded-2xl shadow-sm text-sm leading-relaxed border backdrop-blur-xl ${
                        msg.sender === "user"
                          ? "bg-slate-200/80 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-medium rounded-tr-none border-slate-300 dark:border-zinc-700/50"
                          : "bg-white/90 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-100 border-slate-200 dark:border-zinc-800/80 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </MessageContent>

                    {/* Structured Cards Dispatcher */}
                    {msg.cards && msg.cards.length > 0 && (
                      <div className="space-y-4 pt-2">
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
                </PKMessage>
              </motion.div>
            ))}

            {/* SSE Stream Placeholder rendering while active */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-[85%]"
              >
                <PKMessage className="flex gap-4">
                  <MessageAvatar
                    src=""
                    alt="Agent"
                    fallback={<Bank className="w-5 h-5 text-amber-500" weight="fill" />}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 text-slate-900 dark:text-white flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse"
                  />
                  <div className="space-y-3 flex-1 min-w-0">
                    <MessageContent
                      markdown={true}
                      className="p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800/80 rounded-tl-none shadow-sm text-sm leading-relaxed backdrop-blur-xl"
                    >
                      {streamText === "" ? "Analyzing query..." : streamText}
                    </MessageContent>

                    {streamText === "" && (
                      <div className="flex gap-1.5 py-1 px-2 mt-1">
                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></motion.span>
                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></motion.span>
                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></motion.span>
                      </div>
                    )}

                    {streamCards && (
                      <div className="space-y-4 pt-2">
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
                </PKMessage>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-slate-200 dark:border-zinc-800/80 p-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
          <div className="max-w-4xl mx-auto">
            <PromptInput
              value={inputText}
              onValueChange={setInputText}
              onSubmit={() => handleSendMessage(inputText)}
              disabled={isStreaming}
              className="relative flex flex-col bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-700/50 px-4 py-3 rounded-2xl focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-amber-500/50 transition-colors shadow-inner"
            >
              <PromptInputTextarea
                placeholder="Ask a question or reply to the agent..."
                disabled={isStreaming}
                className="text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 min-h-[44px]"
              />
              <PromptInputActions className="justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 mt-2">
                <div className="flex gap-2">
                  <PromptInputAction tooltip="Upload Supporting Files" side="top">
                    <Link
                      href={`/documents/${sessionId}`}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Paperclip className="w-4.5 h-4.5" weight="bold" />
                    </Link>
                  </PromptInputAction>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendMessage(inputText)}
                  disabled={isStreaming || !inputText.trim()}
                  className="inline-flex items-center justify-center p-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-500 text-white dark:text-zinc-950 rounded-xl focus:outline-none font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  title="Send Message"
                >
                  {isStreaming ? (
                    <Spinner className="w-4 h-4 animate-spin" weight="bold" />
                  ) : (
                    <PaperPlaneTilt className="w-4 h-4" weight="fill" />
                  )}
                </button>
              </PromptInputActions>
            </PromptInput>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL (Desktop Only) */}
      <div className="hidden md:flex md:w-[380px] lg:w-[420px] flex-shrink-0 border-l border-slate-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl p-6 flex-col gap-8 overflow-y-auto custom-scrollbar relative z-10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none opacity-50" />
        <div className="relative z-10 space-y-8">
          {sessionInfo?.steps && <WorkflowTracker steps={sessionInfo.steps} />}
          {documents && <DocumentChecklist documents={documents} />}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 z-50 md:hidden flex justify-end backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-full bg-white dark:bg-zinc-950 h-full shadow-2xl p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar transition-all duration-300 animate-slide-in border-l border-slate-200 dark:border-zinc-800/80">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-zinc-800/80">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">
                Application Status
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white focus:outline-none transition-colors"
              >
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>
            {sessionInfo?.steps && <WorkflowTracker steps={sessionInfo.steps} />}
            {documents && <DocumentChecklist documents={documents} />}
          </div>
        </div>
      )}
    </div>
  );
}
