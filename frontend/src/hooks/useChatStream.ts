"use client";

import { useState } from "react";

export interface StreamResponse {
  reply_text: string;
  cards?: any[];
  current_step: number;
  total_steps: number;
}

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamCards, setStreamCards] = useState<any[] | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);

  const startStream = async (
    message: string,
    sessionId: string,
    onDone?: (finalText: string, finalCards?: any[]) => void
  ) => {
    setIsStreaming(true);
    setStreamText("");
    setStreamCards(null);

    try {
      const response = await fetch(
        `/api/proxy/chat/stream?sessionId=${encodeURIComponent(
          sessionId
        )}&message=${encodeURIComponent(message)}`
      );

      if (!response.ok) {
        throw new Error("Failed to start chat stream");
      }

      if (!response.body) {
        throw new Error("No response body available for streaming");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastText = "";
      let lastCards: any[] | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed: StreamResponse = JSON.parse(dataStr);
              setStreamText(parsed.reply_text);
              lastText = parsed.reply_text;

              if (parsed.cards) {
                setStreamCards(parsed.cards);
                lastCards = parsed.cards;
              }
              if (parsed.current_step) {
                setCurrentStep(parsed.current_step);
              }
              if (parsed.total_steps) {
                setTotalSteps(parsed.total_steps);
              }
            } catch (e) {
              console.error("Failed to parse SSE line:", trimmed, e);
            }
          }
        }
      }

      if (onDone) {
        onDone(lastText, lastCards);
      }
    } catch (error) {
      console.error("Error in chat stream:", error);
      setStreamText("Communication error occurred. Please retry your message.");
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    isStreaming,
    streamText,
    streamCards,
    currentStep,
    totalSteps,
    startStream,
  };
}
