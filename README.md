# GovPilot AI v1 — Sri Lankan Centralized Citizen Portal

GovPilot AI is a centralized, service-agnostic digital public services portal built specifically for Sri Lankan citizens. No specific government service is hardcoded into the application logic, routing, or layouts. Instead, services are defined and loaded dynamically via JSON-based configurations.

This platform provides a unified workspace for citizens to interact conversationally with all government departments, supported by automated OCR document checking, real-time stepper tracking, and direct delivery.


---

## Core Features

1. **Service-Agnostic Engine**: Layouts, headers, document desks, progress bars, and vertical stepper trackers are populated dynamically from the active session's configuration parameters.
2. **Unified Conversational Dispatcher**: If a session starts with no preselected service, the citizen talks to a central AI dispatcher. The agent identifies the citizen's needs using text keyword intent detection and dynamically transitions the session to the target service (applying its workflow plan, steps, and document requirements).
3. **Conversational Agent Stream (SSE)**: Streams text messages and structured UI cards word-by-word from the FastAPI proxy using browser-native `ReadableStream` APIs.
4. **Automated OCR Polling**: Periodically requests document OCR scanning statuses every 2.5 seconds using TanStack Query and automatically halts polling once all files are verified.
6. **A11y Floor**: Standard focus rings, contrast ratios exceeding WCAG AA limits, and layout height stability.
