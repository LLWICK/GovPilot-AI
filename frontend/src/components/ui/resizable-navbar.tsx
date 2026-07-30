"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Bank, Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

interface NavItem {
  name: string;
  link: string;
}

export const ResizableNavbar = ({
  navItems,
}: {
  navItems: NavItem[];
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
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-[120px]">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
          <Bank className="w-5 h-5 text-amber-500" weight="fill" />
        </div>
        <span
          className={cn(
            "font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block whitespace-nowrap transition-all duration-300",
            isScrolled ? "opacity-0 w-0 scale-95 pointer-events-none overflow-hidden" : "opacity-100 w-auto scale-100"
          )}
        >
          GovPilot
        </span>
      </div>

      {/* Centered Navigation Links */}
      <nav className="flex-1 flex items-center justify-center gap-6 text-xs sm:text-sm font-extrabold text-slate-600 dark:text-zinc-400">
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

      {/* Right Action Controls */}
      <div className="flex items-center gap-3 shrink-0 min-w-[120px] justify-end">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8.5 h-8.5 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-all bg-white/80 dark:bg-zinc-950/40"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" weight="bold" />
            ) : (
              <Moon className="w-4 h-4" weight="bold" />
            )}
          </button>
        )}

        {/* Primary CTA */}
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-9 px-4 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-950 rounded-full text-xs font-extrabold transition-all shadow-sm active:scale-95"
        >
          <span>Chat with Agent</span>
        </Link>
      </div>
    </header>
  );
};
