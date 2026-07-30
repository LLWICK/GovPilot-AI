"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all focus:outline-none"
      title="Sign Out"
    >
      <SignOut className="w-4 h-4" weight="bold" />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  );
}
