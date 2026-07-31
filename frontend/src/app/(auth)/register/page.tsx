"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bank, ArrowRight, Warning, Checks, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";
import { MagicCard } from "@/components/ui/magic-card";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import ThemeToggle from "@/components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Form States
  const [fullName, setFullName] = useState("");
  const [nic, setNic] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError("");
    window.history.pushState(null, "", newMode === "login" ? "/login" : "/register");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please verify and retry.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanNic = nic.trim().toUpperCase();
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(cleanNic)) {
      setError("Please enter a valid Sri Lankan National Identity Card (NIC) number (e.g. 198428109283 or 842810928V).");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const registration = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          nic: cleanNic,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!registration.ok) {
        const body = (await registration.json().catch(() => ({}))) as {
          detail?: string | Array<{ msg?: string }>;
        };
        const detail = Array.isArray(body.detail)
          ? body.detail[0]?.msg
          : body.detail;
        setError(detail ?? "Registration failed. Please verify your details and retry.");
        return;
      }

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Your account was created. Please sign in with your new credentials.");
        setMode("login");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-sans flex select-none transition-colors duration-200">
      
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 1. Form Container Panel */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-12 lg:px-16 py-8 transition-transform duration-500 ease-in-out z-20 bg-slate-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar",
          mode === "register" ? "lg:translate-x-full" : "lg:translate-x-0"
        )}
      >
        <MagicCard className="max-w-md w-full mx-auto bg-white/90 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-850 p-5 sm:p-7 md:p-8 shadow-xl dark:shadow-none my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            {/* Logo & Header */}
            <div className="space-y-1.5">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Bank className="w-5 h-5 text-amber-500" weight="fill" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">GovPilot AI</span>
              </Link>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
                {mode === "login" ? "Sign In to Console" : "Create Citizen Account"}
              </h2>
            </div>

            {/* Error Callout */}
            {error && (
              <div className="flex gap-2.5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
                <Warning className="w-4.5 h-4.5 flex-shrink-0 text-rose-500 mt-0.5" weight="fill" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Forms Switcher */}
            {mode === "login" ? (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    placeholder="name@domain.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <HoverBorderGradient
                  as="button"
                  type="submit"
                  disabled={loading}
                  containerClassName="w-full"
                  className="w-full bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-center gap-2 h-full disabled:opacity-40 font-bold"
                >
                  {loading ? "Authenticating..." : "Sign in"}
                  {!loading && <ArrowRight className="w-4 h-4 text-amber-500" weight="bold" />}
                </HoverBorderGradient>

                <div className="text-center text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pt-2">
                  New citizen?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("register")}
                    className="text-amber-600 dark:text-amber-500 hover:underline transition-all ml-1 font-extrabold"
                  >
                    Register Account
                  </button>
                </div>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 sm:space-y-3.5">
                <div className="space-y-1">
                  <label
                    htmlFor="fullName"
                    className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Full Name (as in NIC)
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={loading}
                    placeholder="K. L. Perera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 sm:h-10.5 px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="nic"
                    className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    NIC Number
                  </label>
                  <input
                    id="nic"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="e.g. 198428109283"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    className="w-full h-10 sm:h-10.5 px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="register-email"
                    className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    placeholder="name@domain.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 sm:h-10.5 px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="register-password"
                    className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 sm:h-10.5 px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>

                <div className="pt-1">
                  <HoverBorderGradient
                    as="button"
                    type="submit"
                    disabled={loading}
                    containerClassName="w-full"
                    className="w-full bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-center gap-2 h-full disabled:opacity-40 font-bold"
                  >
                    {loading ? "Registering..." : "Create Account"}
                    {!loading && <ArrowRight className="w-4 h-4 text-amber-500" weight="bold" />}
                  </HoverBorderGradient>
                </div>

                <div className="text-center text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pt-1">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="text-amber-600 dark:text-amber-500 hover:underline transition-all ml-1 font-extrabold"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </MagicCard>
      </div>

      {/* 2. Space Filler Panel */}
      <div
        className={cn(
          "hidden lg:flex lg:w-1/2 flex-col justify-between p-10 lg:p-12 bg-slate-100/80 dark:bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 ease-in-out z-10 overflow-hidden absolute top-0 bottom-0 h-full right-0",
          mode === "login"
            ? "translate-x-0 border-l border-slate-200/80 dark:border-zinc-800/80 rounded-l-[2rem] rounded-r-none"
            : "-translate-x-full border-r border-slate-200/80 dark:border-zinc-800/80 rounded-r-[2rem] rounded-l-none"
        )}
      >
        {/* Magic UI Ripple Background */}
        <Ripple className="opacity-60 dark:opacity-30" />

        {/* Top Header: Small Honest Badge */}
        <div className="relative z-10 flex justify-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-1 rounded-full border border-slate-200/80 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
            GovPilot AI — Built for Sri Lankan Government Services
          </span>
        </div>

        {/* Central Display: Concrete Capabilities & Live Product Preview */}
        <div className="relative z-10 space-y-6 max-w-md mx-auto my-auto w-full">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              One login. Every government service.
            </h3>
          </div>

          {/* Live Product Preview (Mock Agent Exchange) */}
          <div className="bg-white/90 dark:bg-zinc-950/80 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-4 shadow-md space-y-3 text-xs backdrop-blur-md">
            {/* User Prompt */}
            <div className="flex justify-end">
              <div className="bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-2xl rounded-tr-xs px-3.5 py-2 font-medium max-w-[85%] leading-relaxed">
                What documents do I need for a passport renewal?
              </div>
            </div>

            {/* Agent Exchange */}
            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bank className="w-3.5 h-3.5" weight="fill" />
              </div>
              <div className="bg-slate-100/90 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-tl-xs px-3.5 py-2 font-medium leading-relaxed max-w-[88%] border border-slate-200/50 dark:border-zinc-800/50">
                You will need your current passport, NIC, and a digital photo. I can extract and verify them instantly via OCR.
              </div>
            </div>
          </div>

        </div>


      </div>

    </div>
  );
}
