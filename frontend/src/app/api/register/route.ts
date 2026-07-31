import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("GovPilot registration request failed:", error);
    return NextResponse.json(
      { detail: "The authentication service is unavailable. Please try again." },
      { status: 502 }
    );
  }
}
