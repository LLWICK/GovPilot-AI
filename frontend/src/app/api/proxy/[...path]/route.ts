import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

interface BackendError {
  detail?: string;
}

interface ChatTurnResponse {
  assistantMessage: {
    text: string;
    cards?: unknown[];
  };
  needsClarification: boolean;
}

async function requestBackend(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

async function forwardJson(response: Response): Promise<NextResponse> {
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

function backendUnavailable(error: unknown): NextResponse {
  console.error("GovPilot backend request failed:", error);
  return NextResponse.json(
    {
      detail:
        "The GovPilot backend is unavailable. Start FastAPI on port 8000 and retry.",
    },
    { status: 502 }
  );
}

async function streamChatResponse(
  sessionId: string,
  message: string,
  language: "en" | "si" | "ta"
): Promise<Response> {
  const backendResponse = await requestBackend(
    `/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content: message,
        language,
      }),
    }
  );

  if (!backendResponse.ok) {
    const error = (await backendResponse
      .json()
      .catch(() => ({}))) as BackendError;
    return NextResponse.json(
      {
        detail:
          error.detail ??
          `The AI backend returned HTTP ${backendResponse.status}.`,
      },
      { status: backendResponse.status }
    );
  }

  const chatTurn = (await backendResponse.json()) as ChatTurnResponse;
  const replyText = chatTurn.assistantMessage.text;
  const cards = chatTurn.assistantMessage.cards ?? [];
  const words = replyText.split(/\s+/).filter(Boolean);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let accumulatedText = "";

      for (let index = 0; index < words.length; index += 1) {
        accumulatedText += `${index === 0 ? "" : " "}${words[index]}`;
        const payload = {
          reply_text: accumulatedText,
          cards: index === words.length - 1 ? cards : undefined,
          needs_clarification: chatTurn.needsClarification,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      if (words.length === 0) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              reply_text: replyText,
              cards,
              needs_clarification: chatTurn.needsClarification,
            })}\n\n`
          )
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");

  try {
    if (path === "sessions") {
      return forwardJson(await requestBackend("/sessions"));
    }

    if (path.startsWith("sessions/")) {
      const sessionId = path.split("/")[1];
      return forwardJson(
        await requestBackend(`/sessions/${encodeURIComponent(sessionId)}`)
      );
    }

    if (path === "chat/history") {
      const sessionId = request.nextUrl.searchParams.get("sessionId");
      if (!sessionId) {
        return NextResponse.json(
          { detail: "sessionId is required." },
          { status: 422 }
        );
      }
      return forwardJson(
        await requestBackend(
          `/sessions/${encodeURIComponent(sessionId)}/messages`
        )
      );
    }

    if (path === "documents") {
      // The persistent document/OCR API is the next backend milestone.
      return NextResponse.json([]);
    }

    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  } catch (error) {
    return backendUnavailable(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");

  try {
    if (path === "sessions/new") {
      const serviceId = request.nextUrl.searchParams.get("serviceId");
      return forwardJson(
        await requestBackend("/sessions", {
          method: "POST",
          body: JSON.stringify({
            serviceId: serviceId || null,
          }),
        })
      );
    }

    if (path === "chat/stream") {
      const body = (await request.json()) as {
        sessionId?: string;
        message?: string;
        language?: "en" | "si" | "ta";
      };

      if (!body.sessionId || !body.message?.trim()) {
        return NextResponse.json(
          { detail: "sessionId and message are required." },
          { status: 422 }
        );
      }

      return streamChatResponse(
        body.sessionId,
        body.message.trim(),
        body.language ?? "en"
      );
    }

    if (path === "documents/upload") {
      return NextResponse.json(
        {
          detail:
            "Document upload will be enabled after the persistent document API is implemented.",
        },
        { status: 501 }
      );
    }

    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  } catch (error) {
    return backendUnavailable(error);
  }
}
