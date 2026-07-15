"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Bank, SquaresFour } from "@phosphor-icons/react";

interface NavItem {
  name: string;
  link: string;
}

export const ResizableNavbar = ({
  navItems,
  lang,
  setLang,
}: {
  navItems: NavItem[];
  lang: "en" | "si" | "ta";
  setLang: (lang: "en" | "si" | "ta") => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-50 mx-auto flex h-16 items-center justify-between px-6 border-b transition-all duration-350 ease-out backdrop-blur-md text-white",
        isScrolled
          ? "w-[92%] max-w-[540px] top-[16px] rounded-full bg-zinc-900/85 border-zinc-700/40 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3)]"
          : "w-full max-w-full top-0 rounded-none bg-zinc-950/80 border-zinc-900/20"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center text-white shrink-0">
          <Bank className="w-5 h-5 text-amber-500" weight="fill" />
        </div>
        <span
          className={cn(
            "font-extrabold text-sm tracking-tight text-white block whitespace-nowrap transition-all duration-300",
            isScrolled ? "opacity-0 w-0 scale-95 pointer-events-none overflow-hidden" : "opacity-100 w-auto scale-100"
          )}
        >
          GovPilot AI
        </span>
      </div>

      <nav className="flex items-center gap-4 sm:gap-6 text-xs font-bold text-zinc-400">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.link}
            className="hover:text-white transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        {/* Language Switcher */}
        <div
          className={cn(
            "flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 transition-all duration-300",
            isScrolled ? "opacity-0 w-0 scale-95 pointer-events-none overflow-hidden" : "opacity-100 w-auto scale-100"
          )}
        >
          {["en", "si", "ta"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l as "en" | "si" | "ta")}
              className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${
                lang === l
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {l === "en" ? "EN" : l === "si" ? "සිං" : "தமிழ்"}
            </button>
          ))}
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 h-8 px-4 border border-zinc-850 hover:bg-zinc-900 rounded text-xs font-bold text-white transition-all bg-zinc-950/40"
        >
          <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-slate-950">
            <SquaresFour className="w-3 h-3" weight="fill" />
          </div>
          <span className={cn(
            "transition-all duration-300",
            isScrolled ? "opacity-0 w-0 scale-95 pointer-events-none overflow-hidden" : "opacity-100 w-auto scale-100 hidden sm:inline"
          )}>
            Open Workspace
          </span>
        </Link>
      </div>
    </header>
  );
};
