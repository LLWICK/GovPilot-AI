"use client";

import { useState } from "react";

export interface StreamResponse {
  assistantMessage: {
    text: string;
    cards?: any[];
  };
  needsClarification?: boolean;
}

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamCards, setStreamCards] = useState<any[] | null>(null);

  const startStream = async (
    message: string,
    sessionId: string,
    onDone?: (finalText: string, finalCards?: any[]) => void
  ) => {
    setIsStreaming(true);
    setStreamText("");
    setStreamCards(null);

    try {
      const response = await fetch(`/api/backend/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
          language: "en",
        }),
      });

      if (!response.ok) {
        const errorPayload = await response
          .json()
          .catch(() => ({ detail: "Failed to start chat stream." }));
        throw new Error(
          errorPayload.detail ||
            `The backend returned HTTP ${response.status}.`
        );
      }

      const parsed = (await response.json()) as StreamResponse;
      const lastText = parsed.assistantMessage.text;
      const lastCards = parsed.assistantMessage.cards;
      setStreamText(lastText);
      setStreamCards(lastCards ?? null);

      if (onDone) {
        onDone(lastText, lastCards);
      }
    } catch (error) {
      console.error("Error in chat stream:", error);
      setStreamText(
        error instanceof Error
          ? error.message
          : "Communication error occurred. Please retry your message."
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    isStreaming,
    streamText,
    streamCards,
    startStream,
  };
}
