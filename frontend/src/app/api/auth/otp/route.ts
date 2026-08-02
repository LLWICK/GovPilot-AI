import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();
    const endpoint = action === "verify" ? "verify-otp" : "send-otp";

    const response = await fetch(`${BACKEND_URL}/auth/${endpoint}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("GovPilot OTP request failed:", error);
    return NextResponse.json(
      { detail: "The OTP service is currently unavailable. Please try again." },
      { status: 502 }
    );
  }
}
