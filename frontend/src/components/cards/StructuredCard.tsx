"use client";

import React from "react";
import StepPlanCard from "./StepPlanCard";
import DocumentRequestCard from "./DocumentRequestCard";
import DocumentStatusCard from "./DocumentStatusCard";
import ConfirmationCard from "./ConfirmationCard";

export interface CardProps {
  type: "step_plan" | "document_request" | "document_status" | "confirmation";
  steps?: any[];
  required?: string[];
  doc?: string;
  status?: "processing" | "verified" | "issue";
  note?: string;
  summary?: string;
  action?: string;
}

interface StructuredCardProps {
  card: CardProps;
  sessionId: string;
  onConfirm?: () => void;
}

export default function StructuredCard({
  card,
  sessionId,
  onConfirm,
}: StructuredCardProps) {
  switch (card.type) {
    case "step_plan":
      return card.steps ? <StepPlanCard steps={card.steps} /> : null;
    case "document_request":
      return card.required ? (
        <DocumentRequestCard required={card.required} sessionId={sessionId} />
      ) : null;
    case "document_status":
      return card.doc && card.status ? (
        <DocumentStatusCard
          doc={card.doc}
          status={card.status}
          note={card.note}
        />
      ) : null;
    case "confirmation":
      return card.summary && card.action ? (
        <ConfirmationCard
          summary={card.summary}
          action={card.action}
          onConfirm={onConfirm}
        />
      ) : null;
    default:
      return null;
  }
}
