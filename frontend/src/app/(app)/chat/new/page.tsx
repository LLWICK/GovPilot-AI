"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner, Bank } from "@phosphor-icons/react";

function NewChatSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    async function initializeSession() {
      try {
        const url = serviceId
          ? `/api/proxy/sessions/new?serviceId=${encodeURIComponent(serviceId)}`
          : "/api/proxy/sessions/new";

        const res = await fetch(url, {
          method: "POST",
        });

        if (!res.ok) throw new Error("Failed to initialize session");

        const session = await res.json();
        router.replace(`/chat/${session.sessionId}`);
      } catch (err) {
        console.error(err);
        router.replace("/dashboard");
      }
    }

    initializeSession();
  }, [router, serviceId]);

  return (
    <div className="flex-grow flex flex-col justify-center items-center p-8 bg-slate-50 font-sans">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mx-auto shadow-sm animate-pulse">
          <Bank className="w-6 h-6" weight="fill" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-800">
            Setting Up Secure Portal
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Initializing your official government citizen workspace. Please do not close the window.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Spinner className="w-6 h-6 text-primary animate-spin" weight="bold" />
        </div>
      </div>
    </div>
  );
}

export default function NewChatSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex flex-col justify-center items-center p-8 bg-slate-50 font-sans">
          <Spinner className="w-6 h-6 text-primary animate-spin" weight="bold" />
        </div>
      }
    >
      <NewChatSessionContent />
    </Suspense>
  );
}
