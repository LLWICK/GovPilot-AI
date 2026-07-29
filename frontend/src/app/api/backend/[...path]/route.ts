import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await params;
  const session = await getServerSession(authOptions);
  const target = new URL(`${BACKEND_URL}/${path.map(encodeURIComponent).join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));

  const headers = new Headers();
  for (const name of ["accept", "content-type", "x-file-name"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (session?.accessToken) {
    headers.set("authorization", `Bearer ${session.accessToken}`);
  }

  try {
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const response = await fetch(target, {
      method: request.method,
      cache: "no-store",
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("GovPilot backend request failed:", error);
    return NextResponse.json(
      { detail: "The GovPilot backend is unavailable." },
      { status: 502 }
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
