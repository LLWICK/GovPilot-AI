"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bank, ArrowRight, Warning, Check, X, EnvelopeSimple, ShieldCheck, Key, ArrowClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";
import { MagicCard } from "@/components/ui/magic-card";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import ThemeToggle from "@/components/ThemeToggle";

interface FieldErrors {
  fullName?: string;
  nic?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Form States
  const [fullName, setFullName] = useState("");
  const [nic, setNic] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // OTP Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendStatus, setResendStatus] = useState("");

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const toggleMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError("");
    setSuccessMessage("");
    setFieldErrors({});
    setTouched({});
    window.history.pushState(null, "", newMode === "login" ? "/login" : "/register");
  };

  const validateFullName = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "Full Name is required.";
    if (trimmed.length < 2) return "Full Name must be at least 2 characters.";
    if (!/^[A-Za-z\s\.\-']+$/.test(trimmed)) {
      return "Full Name can only contain letters, spaces, dots, hyphens, and apostrophes.";
    }
    return "";
  };

  const validateNic = (val: string): string => {
    const clean = val.trim().toUpperCase();
    if (!clean) return "NIC Number is required.";
    const nicRegex = /^([0-9]{9}[VvXx]|[0-9]{12})$/;
    if (!nicRegex.test(clean)) {
      return "Enter a valid Sri Lankan NIC (e.g. 198428109283 or 842810928V).";
    }
    return "";
  };

  const validateEmail = (val: string): string => {
    const clean = val.trim().toLowerCase();
    if (!clean) return "Email Address is required.";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return "Enter a valid email address (e.g. name@domain.lk).";
    }
    return "";
  };

  const validatePassword = (val: string): string => {
    if (!val) return "Password is required.";
    if (val.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(val)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(val)) return "Password must contain at least one lowercase letter.";
    if (!/[\d\W]/.test(val)) return "Password must contain at least one number or special character.";
    return "";
  };

  const validateConfirmPassword = (pass: string, confirm: string): string => {
    if (!confirm) return "Please confirm your password.";
    if (pass !== confirm) return "Passwords do not match.";
    return "";
  };

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[\d\W]/.test(password);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runFieldValidation(field);
  };

  const runFieldValidation = (field: string) => {
    let err = "";
    if (field === "fullName") err = validateFullName(fullName);
    else if (field === "nic") err = validateNic(nic);
    else if (field === "email") err = validateEmail(email);
    else if (field === "password") err = validatePassword(password);
    else if (field === "confirmPassword") err = validateConfirmPassword(password, confirmPassword);

    setFieldErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Google authentication failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

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
    setError("");
    setSuccessMessage("");

    const fullNameErr = validateFullName(fullName);
    const nicErr = validateNic(nic);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);

    const errors: FieldErrors = {
      fullName: fullNameErr,
      nic: nicErr,
      email: emailErr,
      password: passwordErr,
      confirmPassword: confirmErr,
    };

    setFieldErrors(errors);
    setTouched({
      fullName: true,
      nic: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (fullNameErr || nicErr || emailErr || passwordErr || confirmErr) {
      setError("Please fix the highlighted validation errors before submitting.");
      return;
    }

    setLoading(true);
    const cleanNic = nic.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    try {
      const registration = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          nic: cleanNic,
          email: cleanEmail,
          password,
        }),
      });

      if (!registration.ok) {
        const body = (await registration.json().catch(() => ({}))) as {
          detail?: string | Array<{ loc?: string[]; msg?: string }>;
        };

        if (Array.isArray(body.detail)) {
          const newErrors: FieldErrors = {};
          body.detail.forEach((item) => {
            let msg = item.msg ?? "";
            if (msg.startsWith("Value error, ")) {
              msg = msg.replace("Value error, ", "");
            }
            const targetField = item.loc?.[item.loc.length - 1];
            if (targetField === "name") newErrors.fullName = msg;
            else if (targetField === "nic") newErrors.nic = msg;
            else if (targetField === "email") newErrors.email = msg;
            else if (targetField === "password") newErrors.password = msg;
          });
          setFieldErrors(newErrors);
          setError("Registration details failed validation. Check fields below.");
        } else if (typeof body.detail === "string") {
          const detailMsg = body.detail;
          if (detailMsg.toLowerCase().includes("email")) {
            setFieldErrors((prev) => ({ ...prev, email: detailMsg }));
          } else if (detailMsg.toLowerCase().includes("nic")) {
            setFieldErrors((prev) => ({ ...prev, nic: detailMsg }));
          }
          setError(detailMsg);
        } else {
          setError("Registration failed. Please verify your details and retry.");
        }
        return;
      }

      setShowVerifyModal(true);
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
          purpose: "email_verification",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setOtpError(body.detail || "Invalid or expired OTP code.");
        return;
      }

      setShowVerifyModal(false);
      
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setSuccessMessage("Email verified successfully! Please sign in.");
        setMode("login");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setOtpError("Failed to verify OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendStatus("Sending new code...");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          email: email.trim().toLowerCase(),
          purpose: "email_verification",
        }),
      });
      if (res.ok) {
        setResendStatus("New OTP sent to your email.");
      } else {
        setResendStatus("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setResendStatus("Failed to send OTP.");
    }
    setTimeout(() => setResendStatus(""), 4000);
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(resetEmail);
    if (!resetEmail || emailErr) {
      setResetError(emailErr || "Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          email: resetEmail.trim().toLowerCase(),
          purpose: "password_reset",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResetError(body.detail || "Unable to send password reset code.");
        return;
      }

      setResetStep(2);
    } catch (err) {
      setResetError("Request failed. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setResetError("Please enter the 6-digit verification code.");
      return;
    }
    const passErr = validatePassword(newPassword);
    if (passErr) {
      setResetError(passErr);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          code: resetOtp.trim(),
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResetError(body.detail || "Password reset failed. Check your OTP code.");
        return;
      }

      setShowResetModal(false);
      setSuccessMessage("Password reset successfully! Please sign in.");
      setMode("login");
      setEmail(resetEmail);
      setPassword("");
    } catch (err) {
      setResetError("An error occurred during password reset.");
    } finally {
      setResetLoading(false);
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
          "absolute inset-y-0 left-0 w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-10 py-4 sm:py-6 transition-transform duration-500 ease-in-out z-20 bg-slate-50 dark:bg-zinc-950 overflow-y-auto",
          mode === "register" ? "lg:translate-x-full" : "lg:translate-x-0"
        )}
      >
        <MagicCard className="max-w-md w-full mx-auto bg-white/90 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-850 p-5 sm:p-6 md:p-7 shadow-xl dark:shadow-none my-auto max-h-[96vh] overflow-y-auto">
          <div className="space-y-3.5 sm:space-y-4">
            {/* Logo & Header */}
            <div className="space-y-1">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-7.5 h-7.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Bank className="w-4 h-4 text-amber-500" weight="fill" />
                </div>
                <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white">GovPilot AI</span>
              </Link>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-0.5">
                {mode === "login" ? "Sign In to Console" : "Create Account"}
              </h2>
            </div>

            {/* Success Callout */}
            {successMessage && (
              <div className="flex gap-2.5 p-3 rounded-xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" weight="bold" />
                <p className="font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Error Callout */}
            {error && (
              <div className="flex gap-2.5 p-3 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
                <Warning className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" weight="fill" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full h-[42px] rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <GoogleIcon />
              {googleLoading ? "Connecting..." : `Continue with Google`}
            </button>

            <div className="relative flex items-center my-2.5">
              <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[9.5px] uppercase font-bold text-slate-400 dark:text-zinc-600 tracking-wider">
                Or with email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
            </div>

            {/* Forms Switcher */}
            {mode === "login" ? (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label
                    htmlFor="login-email"
                    className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
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
                    className="w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="login-password"
                      className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetStep(1);
                        setResetError("");
                        setShowResetModal(true);
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-500 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>

                <div className="pt-0.5">
                  <HoverBorderGradient
                    as="button"
                    type="submit"
                    disabled={loading}
                    containerClassName="w-full"
                    className="w-full bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-center gap-2 h-[42px] rounded-xl disabled:opacity-40 font-bold text-xs sm:text-sm"
                  >
                    {loading ? "Authenticating..." : "Sign in"}
                    {!loading && <ArrowRight className="w-4 h-4 text-amber-500" weight="bold" />}
                  </HoverBorderGradient>
                </div>

                <div className="text-center text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pt-1">
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
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <label
                    htmlFor="fullName"
                    className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
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
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (touched.fullName) {
                        setFieldErrors((prev) => ({ ...prev, fullName: validateFullName(e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("fullName")}
                    className={cn(
                      "w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60",
                      touched.fullName && fieldErrors.fullName
                        ? "border-rose-500 dark:border-rose-500 focus:border-rose-500"
                        : "border-slate-200 dark:border-zinc-800 focus:border-amber-500"
                    )}
                  />
                  {touched.fullName && fieldErrors.fullName && (
                    <p className="text-[10.5px] text-rose-500 font-semibold pt-0.5">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* NIC Number */}
                <div className="space-y-1">
                  <label
                    htmlFor="nic"
                    className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    NIC Number
                  </label>
                  <input
                    id="nic"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="e.g. 198428109283 or 842810928V"
                    value={nic}
                    onChange={(e) => {
                      const formatted = e.target.value.toUpperCase();
                      setNic(formatted);
                      if (touched.nic) {
                        setFieldErrors((prev) => ({ ...prev, nic: validateNic(formatted) }));
                      }
                    }}
                    onBlur={() => handleBlur("nic")}
                    className={cn(
                      "w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60",
                      touched.nic && fieldErrors.nic
                        ? "border-rose-500 dark:border-rose-500 focus:border-rose-500"
                        : "border-slate-200 dark:border-zinc-800 focus:border-amber-500"
                    )}
                  />
                  {touched.nic && fieldErrors.nic && (
                    <p className="text-[10.5px] text-rose-500 font-semibold pt-0.5">{fieldErrors.nic}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label
                    htmlFor="register-email"
                    className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email) {
                        setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("email")}
                    className={cn(
                      "w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60",
                      touched.email && fieldErrors.email
                        ? "border-rose-500 dark:border-rose-500 focus:border-rose-500"
                        : "border-slate-200 dark:border-zinc-800 focus:border-amber-500"
                    )}
                  />
                  {touched.email && fieldErrors.email && (
                    <p className="text-[10.5px] text-rose-500 font-semibold pt-0.5">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label
                    htmlFor="register-password"
                    className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                      }
                      if (touched.confirmPassword && confirmPassword) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(e.target.value, confirmPassword),
                        }));
                      }
                    }}
                    onBlur={() => handleBlur("password")}
                    className={cn(
                      "w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60",
                      touched.password && fieldErrors.password
                        ? "border-rose-500 dark:border-rose-500 focus:border-rose-500"
                        : "border-slate-200 dark:border-zinc-800 focus:border-amber-500"
                    )}
                  />
                  {touched.password && fieldErrors.password && (
                    <p className="text-[10.5px] text-rose-500 font-semibold pt-0.5">{fieldErrors.password}</p>
                  )}

                  {/* Password Requirements Indicator */}
                  {password.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 px-0.5">
                      <div className="flex items-center gap-1 text-[9.5px] font-medium">
                        {hasMinLength ? (
                          <Check className="w-3 h-3 text-emerald-500 font-bold" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        )}
                        <span className={hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-zinc-500"}>
                          8+ characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] font-medium">
                        {hasUppercase ? (
                          <Check className="w-3 h-3 text-emerald-500 font-bold" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        )}
                        <span className={hasUppercase ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-zinc-500"}>
                          1 Uppercase
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] font-medium">
                        {hasLowercase ? (
                          <Check className="w-3 h-3 text-emerald-500 font-bold" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        )}
                        <span className={hasLowercase ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-zinc-500"}>
                          1 Lowercase
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] font-medium">
                        {hasNumberOrSymbol ? (
                          <Check className="w-3 h-3 text-emerald-500 font-bold" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        )}
                        <span className={hasNumberOrSymbol ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-zinc-500"}>
                          1 Number/Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label
                    htmlFor="confirm-password"
                    className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (touched.confirmPassword) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(password, e.target.value),
                        }));
                      }
                    }}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={cn(
                      "w-full h-[42px] px-3.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/50 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-60",
                      touched.confirmPassword && fieldErrors.confirmPassword
                        ? "border-rose-500 dark:border-rose-500 focus:border-rose-500"
                        : "border-slate-200 dark:border-zinc-800 focus:border-amber-500"
                    )}
                  />
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="text-[10.5px] text-rose-500 font-semibold pt-0.5">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-1">
                  <HoverBorderGradient
                    as="button"
                    type="submit"
                    disabled={loading}
                    containerClassName="w-full"
                    className="w-full bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-center gap-2 h-[42px] rounded-xl disabled:opacity-40 font-bold text-xs sm:text-sm"
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
        <Ripple className="opacity-60 dark:opacity-30" />

        <div className="relative z-10 flex justify-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-1 rounded-full border border-slate-200/80 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
            GovPilot AI — Built for Sri Lankan Government Services
          </span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md mx-auto my-auto w-full">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              One login. Every government service.
            </h3>
          </div>

          <div className="bg-white/90 dark:bg-zinc-950/80 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-4 shadow-md space-y-3 text-xs backdrop-blur-md">
            <div className="flex justify-end">
              <div className="bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-2xl rounded-tr-xs px-3.5 py-2 font-medium max-w-[85%] leading-relaxed">
                What documents do I need for a passport renewal?
              </div>
            </div>

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

      {/* --- OTP VERIFICATION MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                <EnvelopeSimple className="w-6 h-6" weight="bold" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Verify Your Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                We sent a 6-digit verification code to <span className="font-bold text-slate-800 dark:text-zinc-200">{email}</span>.
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
                {otpError}
              </div>
            )}

            {resendStatus && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-semibold text-center">
                {resendStatus}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full h-12 text-center text-xl font-bold tracking-[6px] rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {otpLoading ? "Verifying..." : "Verify & Continue"}
                {!otpLoading && <ShieldCheck className="w-4 h-4" weight="bold" />}
              </button>
            </form>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-amber-600 dark:text-amber-500 font-bold hover:underline inline-flex items-center gap-1"
              >
                <ArrowClockwise className="w-3.5 h-3.5" /> Resend Code
              </button>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PASSWORD RESET MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                <Key className="w-6 h-6" weight="bold" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {resetStep === 1 ? "Reset Password" : "Set New Password"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {resetStep === 1
                  ? "Enter your email to receive a 6-digit OTP code."
                  : `Enter the 6-digit OTP sent to ${resetEmail}`}
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {resetError}
              </div>
            )}

            {resetStep === 1 ? (
              /* Step 1: Send Reset OTP */
              <form onSubmit={handleRequestResetOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@domain.lk"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP & New Password */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full h-11 text-center text-lg font-bold tracking-[4px] rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer pt-1"
                >
                  {resetLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
