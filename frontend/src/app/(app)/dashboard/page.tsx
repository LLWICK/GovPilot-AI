"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  Cardholder,
  Clock,
  FileText,
  Notebook,
  IdentificationCard,
  ChatCircleText,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { motion, type Variants } from "framer-motion";

interface SessionSummary {
  sessionId: string;
  serviceId: string;
  serviceName: string;
  status: string;
  progress: number;
  updatedAt: string;
}

interface GovernmentService {
  serviceId: string;
  name: string;
  agencyName: string;
  description: string;
  fee: string;
  processingTime: string;
}

const SERVICE_ICONS = {
  "passport-renewal": Notebook,
  "nic-application": IdentificationCard,
  "birth-cert-copy": FileText,
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function DashboardPage() {
  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<SessionSummary[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/backend/sessions");
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery<GovernmentService[]>({
    queryKey: ["government-services"],
    queryFn: async () => {
      const res = await fetch("/api/backend/services");
      if (!res.ok) throw new Error("Failed to fetch government services");
      return res.json();
    },
  });

  return (
    <div className="relative w-full flex-grow flex flex-col min-h-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white selection:bg-amber-500/30">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 w-full flex-grow space-y-12 font-sans relative z-10">
        
        {/* Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-zinc-800/80"
        >
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Citizen Workspace
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
              Track, resume, and request digital public services powered by GovPilot Agentic AI.
            </p>
          </div>
          <Link href="/chat/new">
            <HoverBorderGradient className="px-6 py-2 h-11 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 gap-2 font-bold flex items-center text-sm shadow-xl shadow-amber-500/5 transition-all text-slate-900 dark:text-white">
              <ChatCircleText className="w-4 h-4 text-amber-500" weight="fill" />
              <span>General Inquiry Chat</span>
            </HoverBorderGradient>
          </Link>
        </motion.div>

        <div className="space-y-8">
          
          {/* Main Content Area (Active Apps) */}
          <div className="space-y-8">
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
                <Cardholder className="w-5 h-5 text-amber-500" weight="duotone" />
                Active Applications
              </h3>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-3xl h-44 animate-pulse shadow-sm"></div>
                <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-3xl h-44 animate-pulse shadow-sm"></div>
              </div>
            ) : error ? (
              <div className="p-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 rounded-2xl text-rose-600 dark:text-rose-400 font-medium text-sm">
                Error loading your applications. Please refresh the browser.
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 backdrop-blur-xl shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-2 border border-slate-200 dark:border-zinc-700/50">
                  <Cardholder className="w-8 h-8" weight="duotone" />
                </div>
                <h4 className="text-slate-900 dark:text-white font-bold text-lg">No Active Services</h4>
                <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto font-medium leading-relaxed">
                  You currently have no ongoing applications. Select a service from the directory below to get started.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {sessions.map((session) => (
                  <motion.div variants={itemVariants} key={session.sessionId}>
                    <MagicCard
                      className="p-6 flex flex-col justify-between space-y-6 h-full border-slate-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-md dark:shadow-none transition-colors"
                    >
                      {/* Status badge & Ref */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="inline-block text-[9px] font-black text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md uppercase tracking-widest">
                            Ref: {session.sessionId.split("-")[1] || session.sessionId}
                          </span>
                          <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider">
                            {session.status}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                            {session.serviceName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-2">
                            <span className={`w-2 h-2 rounded-full inline-block ${session.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}></span>
                            <span>{session.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="space-y-2 bg-slate-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/50">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          <span>Completion</span>
                          <span className="text-amber-600 dark:text-amber-500">{session.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-400 h-full rounded-full transition-all duration-700 ease-out relative"
                            style={{ width: `${session.progress}%` }}
                          >
                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:1rem_1rem] animate-shine" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <Link
                           href={`/chat/${session.sessionId}`}
                           className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 active:scale-95 transition-transform text-xs font-bold rounded-lg shadow-sm"
                        >
                           <span>Resume Chat</span>
                           <ArrowRight className="w-4 h-4" weight="bold" />
                        </Link>
                        <Link
                           href={`/documents/${session.sessionId}`}
                           className="inline-flex items-center justify-center h-11 px-4 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all rounded-lg text-slate-700 dark:text-zinc-300 text-xs font-bold bg-white dark:bg-transparent shadow-sm dark:shadow-none"
                           title="Upload Supporting Files"
                        >
                           <FileText className="w-4 h-4" />
                           <span className="ml-1.5 hidden sm:inline">Docs</span>
                        </Link>
                      </div>
                    </MagicCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

        </div>

        {/* Service Catalog Directory Section */}
        <div className="space-y-6 pt-10 border-t border-slate-200 dark:border-zinc-800/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Service Directory
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">
              Start a new government service application through an AI-guided workflow.
            </p>
          </div>

          {servicesLoading ? (
            <div className="h-48 rounded-3xl bg-white/60 dark:bg-zinc-900/40 animate-pulse" />
          ) : servicesError ? (
            <div className="p-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 rounded-2xl text-rose-600 dark:text-rose-400 font-medium text-sm">
              Error loading the service directory.
            </div>
          ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(services ?? []).map((service) => {
              const Icon =
                SERVICE_ICONS[service.serviceId as keyof typeof SERVICE_ICONS] ?? FileText;
              return (
                <motion.div
                  variants={itemVariants}
                  key={service.serviceId}
                  className="group relative rounded-3xl bg-white/80 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 p-6 flex flex-col justify-between space-y-6 hover:bg-white dark:hover:bg-zinc-800/40 transition-colors backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
                >
                  <ShineBorder shineColor="#f59e0b" duration={10} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50 text-amber-500 flex items-center justify-center shadow-inner">
                      <Icon className="w-6 h-6" weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                        {service.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                        {service.agencyName}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {service.description}
                    </p>
                  </div>

                  <div className="relative z-10 space-y-4 pt-2">
                    <div className="flex justify-between items-center text-xs font-bold bg-slate-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/50 text-slate-500 dark:text-zinc-400 shadow-inner">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                        {service.processingTime}
                      </span>
                      <span className="text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{service.fee}</span>
                    </div>
                    <Link
                      href={`/chat/new?serviceId=${service.serviceId}`}
                      className="w-full inline-flex items-center justify-center gap-2 h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 active:scale-95 transition-all text-xs font-bold rounded-xl shadow-md dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                      <span>Start Guided Flow</span>
                      <ArrowRight className="w-4 h-4" weight="bold" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
