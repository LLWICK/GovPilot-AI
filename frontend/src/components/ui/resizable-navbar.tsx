"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Bank, SquaresFour, Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          ? "w-[92%] max-w-[620px] top-[16px] rounded-full bg-white/85 dark:bg-zinc-900/85 border-slate-200/40 dark:border-zinc-700/40 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3)]"
          : "w-full max-w-full top-0 rounded-none bg-white/80 dark:bg-zinc-950/80 border-slate-200/20 dark:border-zinc-900/20"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
          <Bank className="w-5 h-5 text-amber-500" weight="fill" />
        </div>
        <span
          className={cn(
            "font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block whitespace-nowrap transition-all duration-300",
            isScrolled ? "opacity-0 w-0 scale-95 pointer-events-none overflow-hidden" : "opacity-100 w-auto scale-100"
          )}
        >
          GovPilot AI
        </span>
      </div>

      <nav className="flex items-center gap-4 sm:gap-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.link}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        {/* Language Switcher */}
        <div
          className={cn(
            "flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded border border-slate-200 dark:border-zinc-800 transition-all duration-300",
            isScrolled ? "opacity-0 w-0 scale-95 pointer-events-none overflow-hidden" : "opacity-100 w-auto scale-100"
          )}
        >
          {["en", "si", "ta"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l as "en" | "si" | "ta")}
              className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${
                lang === l
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {l === "en" ? "EN" : l === "si" ? "සිං" : "தமிழ்"}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-all bg-white dark:bg-zinc-950/40"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" weight="bold" />
            ) : (
              <Moon className="w-4 h-4" weight="bold" />
            )}
          </button>
        )}

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 h-8 px-4 border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded text-xs font-bold text-slate-900 dark:text-white transition-all bg-white dark:bg-zinc-950/40 shadow-sm dark:shadow-none"
        >
          <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-white dark:text-slate-950">
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
