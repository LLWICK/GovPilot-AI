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

export default function ChatPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SSE stream state hook
  const {
    isStreaming,
    streamText,
    streamCards,
    currentStep,
    totalSteps,
    startStream,
  } = useChatStream();

  // 1. Fetch Session Info
  const { data: sessionInfo, refetch: refetchSession } = useQuery<SessionInfo>({
    queryKey: ["sessionInfo", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session metadata");
      return res.json();
    },
  });

  // 2. Fetch Chat History
  const { data: chatHistory, refetch: refetchChat } = useQuery<Message[]>({
    queryKey: ["chatHistory", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/chat/history?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch chat history");
      return res.json();
    },
  });

  // 3. Fetch Document Checklists & Poll while OCR status is "processing"
  const { data: documents, refetch: refetchDocs } = useQuery<Document[]>({
    queryKey: ["documents", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/documents?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    // Poll every 2.5s only if at least one document status is 'processing'
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs && docs.some((d: any) => d.status === "processing")) {
        return 2500;
      }
      return false;
    },
  });

  // Trigger sync on document update to refresh main stepper and headers
  useEffect(() => {
    if (documents) {
      refetchSession();
      refetchChat();
    }
  }, [documents, refetchSession, refetchChat]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamText]);

  // Submit Message handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInputText("");

    // Trigger SSE stream connection
    await startStream(text, sessionId, () => {
      // Stream complete callback: Synchronize query cache
      refetchChat();
      refetchSession();
      refetchDocs();
    });
  };

  // Submit Final Application Confirm callback
  const handleFinalConfirm = () => {
    handleSendMessage("Submit Final Application");
  };

  return (
    <div className="flex-grow flex h-[calc(100dvh-64px)] relative overflow-hidden bg-slate-100 dark:bg-zinc-950 font-sans">
      {/* LEFT CHAT PANEL */}
      <div className="flex-grow flex flex-col justify-between h-full bg-slate-50 dark:bg-zinc-950 relative">
        
        <SessionHeader
          serviceName={sessionInfo?.serviceName || "GovPilot AI Portal"}
          status={sessionInfo?.status || "Connecting..."}
          progress={sessionInfo?.progress || 10}
          agencyName={sessionInfo?.agencyName}
          onMenuToggle={() => setIsDrawerOpen(true)}
        />

        {/* Message List */}
        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
          {chatHistory?.map((msg) => (
            <PKMessage
              key={msg.id}
              className={`max-w-[85%] animate-slide-up-fade ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {/* Avatar Icon */}
              <MessageAvatar
                src=""
                alt={msg.sender === "user" ? "User" : "Agent"}
                fallback={
                  msg.sender === "user" ? (
                    <User className="w-5 h-5 text-white" weight="bold" />
                  ) : (
                    <Bank className="w-5 h-5 text-white" weight="fill" />
                  )
                }
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm border-0 ${
                  msg.sender === "user" ? "bg-primary-light dark:bg-amber-600" : "bg-primary dark:bg-zinc-800"
                }`}
              />

              {/* Message Bubble */}
              <div className="space-y-3 flex-1 min-w-0">
                <MessageContent
                  markdown={msg.sender === "agent"}
                  className={`p-4 rounded-2xl shadow-sm text-base leading-relaxed border ${
                    msg.sender === "user"
                      ? "bg-primary dark:bg-amber-700 text-white font-medium rounded-tr-none border-transparent"
                      : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border-slate-200 dark:border-zinc-800 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </MessageContent>

                {/* Structured Cards Dispatcher */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="space-y-3">
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
          ))}

          {/* SSE Stream Placeholder rendering while active */}
          {isStreaming && (
            <PKMessage className="max-w-[85%] flex gap-3">
              <MessageAvatar
                src=""
                alt="Agent"
                fallback={<Bank className="w-5 h-5 text-white" weight="fill" />}
                className="w-9 h-9 rounded-lg bg-primary dark:bg-zinc-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse border-0"
              />
              <div className="space-y-3 flex-1 min-w-0">
                <MessageContent
                  markdown={true}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-tl-none shadow-sm text-base leading-relaxed"
                >
                  {streamText === "" ? "Thinking..." : streamText}
                </MessageContent>

                {streamText === "" && (
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-650 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-650 animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-650 animate-bounce delay-200"></span>
                  </div>
                )}

                {streamCards && (
                  <div className="space-y-3">
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
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar using Prompt Kit */}
        <div className="border-t border-slate-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
          <div className="max-w-4xl mx-auto">
            <PromptInput
              value={inputText}
              onValueChange={setInputText}
              onSubmit={() => handleSendMessage(inputText)}
              disabled={isStreaming}
              className="relative flex flex-col bg-slate-55 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-4 py-3 rounded-2xl focus-within:bg-white dark:focus-within:bg-zinc-900/60 focus-within:border-zinc-550 transition-colors"
            >
              <PromptInputTextarea
                placeholder="Ask a question or reply to the agent..."
                disabled={isStreaming}
                className="text-base text-slate-800 dark:text-zinc-100 placeholder-slate-450 dark:placeholder-zinc-550 min-h-[44px]"
              />
              <PromptInputActions className="justify-between pt-2 border-t border-slate-100 dark:border-zinc-850 mt-2">
                <div className="flex gap-2">
                  <PromptInputAction tooltip="Upload Supporting Files" side="top">
                    <Link
                      href={`/documents/${sessionId}`}
                      className="p-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800 active-press-trigger text-slate-500 dark:text-zinc-400 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Paperclip className="w-4.5 h-4.5" weight="bold" />
                    </Link>
                  </PromptInputAction>
                </div>

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage(inputText)}
                  disabled={isStreaming || !inputText.trim()}
                  className="inline-flex items-center justify-center p-2.5 bg-primary dark:bg-zinc-800 hover:bg-primary-light dark:hover:bg-zinc-700 active-press-trigger disabled:opacity-40 text-white rounded-xl focus:outline-none"
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
      <div className="hidden md:flex md:w-80 lg:w-[360px] flex-shrink-0 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex-col gap-6 overflow-y-auto custom-scrollbar">
        {sessionInfo?.steps && <WorkflowTracker steps={sessionInfo.steps} />}
        {documents && <DocumentChecklist documents={documents} />}
      </div>

      {/* MOBILE DRAWER (WorkflowTracker / DocumentChecklist overlay) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 md:hidden flex justify-end">
          {/* Backdrop Close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-80 max-w-full bg-slate-50 dark:bg-zinc-950 h-full shadow-2xl p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 animate-slide-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800">
              <h2 className="font-extrabold text-slate-800 dark:text-zinc-100 text-lg">
                Application Status
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-650 dark:text-zinc-400 focus:outline-none"
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
