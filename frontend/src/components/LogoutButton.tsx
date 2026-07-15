"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
      title="Sign Out"
    >
      <SignOut className="w-4 h-4" weight="bold" />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  );
}
