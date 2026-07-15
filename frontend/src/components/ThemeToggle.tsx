"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "@phosphor-icons/react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const activeDark = storedTheme === "dark" || (!storedTheme && systemPrefersDark);
    setIsDark(activeDark);
    
    if (activeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9" />; // Spacer to avoid hydration layout shifts
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 active-press-trigger transition-transform duration-200 hover:rotate-12 text-slate-350 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-450" weight="bold" />
      ) : (
        <Moon className="w-5 h-5 text-slate-300" weight="bold" />
      )}
    </button>
  );
}
