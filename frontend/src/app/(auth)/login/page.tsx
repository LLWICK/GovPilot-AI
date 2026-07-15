"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bank, ArrowRight, Warning, Checks, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";
import { MagicCard } from "@/components/ui/magic-card";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
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
    // Update the browser URL dynamically without full page reload
    window.history.pushState(null, "", newMode === "login" ? "/login" : "/register");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
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

    // Validate NIC format (Sri Lankan NICs are 10 characters ending in V/X, or 12 digits)
    const cleanNic = nic.trim().toUpperCase();
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(cleanNic)) {
      setError("Please enter a valid Sri Lankan National Identity Card (NIC) number (e.g. 198428109283 or 842810928V).");
      setLoading(false);
      return;
    }

    try {
      // Mock registration: immediately sign in using credentials provider
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Registration succeeded but sign in failed. Please try signing in manually.");
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
    <div className="relative w-screen min-h-screen overflow-hidden bg-zinc-950 text-white font-sans flex select-none">
      
      {/* 1. Form Container Panel */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-16 lg:px-20 py-12 transition-transform duration-500 ease-in-out z-20 bg-zinc-950",
          mode === "register" ? "lg:translate-x-full" : "lg:translate-x-0"
        )}
      >
        <MagicCard className="max-w-md w-full mx-auto bg-zinc-950/40 border border-zinc-850 p-6 md:p-8">
          <div className="space-y-6">
            {/* Logo & Header */}
            <div className="space-y-2">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Bank className="w-5 h-5 text-amber-500" weight="fill" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-white">GovPilot AI</span>
              </Link>
              <h2 className="text-3xl font-extrabold tracking-tight text-white pt-2">
                {mode === "login" ? "Sign In to Console" : "Create Citizen Account"}
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                {mode === "login" ? "Official Sri Lanka Citizen Gateway" : "Sri Lankan Official Citizen Portal"}
              </p>
            </div>

            {/* Error Callout */}
            {error && (
              <div className="flex gap-2.5 p-4 rounded-xl border border-rose-950 bg-rose-950/20 text-rose-400 text-xs leading-relaxed">
                <Warning className="w-5 h-5 flex-shrink-0 text-rose-500" weight="fill" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Forms Switcher */}
            {mode === "login" ? (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={loading}
                    placeholder="name@domain.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <HoverBorderGradient
                  as="button"
                  type="submit"
                  disabled={loading}
                  containerClassName="w-full"
                  className="w-full bg-zinc-900 text-white flex items-center justify-center gap-2 h-full disabled:opacity-40"
                >
                  {loading ? "Authenticating..." : "Sign in"}
                  {!loading && <ArrowRight className="w-4 h-4 text-amber-500" weight="bold" />}
                </HoverBorderGradient>

                <div className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider pt-2">
                  New citizen?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("register")}
                    className="text-amber-500 hover:underline transition-all ml-1"
                  >
                    Register Account
                  </button>
                </div>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-wider"
                  >
                    Full Name (as in NIC)
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="K. L. Perera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="nic"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-wider"
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
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={loading}
                    placeholder="name@domain.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-amber-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <HoverBorderGradient
                  as="button"
                  type="submit"
                  disabled={loading}
                  containerClassName="w-full"
                  className="w-full bg-zinc-900 text-white flex items-center justify-center gap-2 h-full disabled:opacity-40"
                >
                  {loading ? "Registering..." : "Create Account"}
                  {!loading && <ArrowRight className="w-4 h-4 text-amber-500" weight="bold" />}
                </HoverBorderGradient>

                <div className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider pt-2">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="text-amber-500 hover:underline transition-all ml-1"
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
          "hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 ease-in-out z-10 overflow-hidden absolute top-0 bottom-0 h-full right-0",
          mode === "login"
            ? "translate-x-0 border-l border-zinc-800/80 rounded-l-[2rem] rounded-r-none"
            : "-translate-x-full border-r border-zinc-800/80 rounded-r-[2rem] rounded-l-none"
        )}
      >
        {/* Magic UI Ripple Background */}
        <Ripple className="opacity-40" />

        {/* Top Header */}
        <div className="relative z-10">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Government of Sri Lanka Civil Portal
          </span>
        </div>

        {/* Central Display */}
        <div className="relative z-10 space-y-6 max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-zinc-850 border border-zinc-800 text-amber-500 flex items-center justify-center">
            <Bank className="w-6 h-6" weight="fill" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              One Workspace. All Digital Public Services.
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Enter details once. Track, review, and finalize passport renewals, NIC replacements, and civil records securely.
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-2 pt-2 text-xs font-bold text-zinc-400">
            <div className="flex items-center gap-2">
              <Checks className="w-4 h-4 text-emerald-500" weight="bold" />
              <span>Real-Time OCR Documents Check</span>
            </div>
            <div className="flex items-center gap-2">
              <Checks className="w-4 h-4 text-emerald-500" weight="bold" />
              <span>Direct Civil Registry Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Checks className="w-4 h-4 text-emerald-500" weight="bold" />
              <span>Tracked Delivery Progress Monitor</span>
            </div>
          </div>
        </div>

        {/* Bottom branding footer */}
        <div className="relative z-10 text-[9px] font-black uppercase tracking-wider text-zinc-550 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Average Processing: 3 Business Days</span>
        </div>
      </div>

    </div>
  );
}
