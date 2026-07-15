import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = await getServerSession();

  if (!session) {
    // Bypass login check for exploration mode, seed mock session
    session = {
      user: {
        name: "K. L. Perera",
        email: "citizen@gov.lk",
      },
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-200">
      {/* Top Shell Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                GovPilot AI
              </span>
              <span className="text-[9px] block text-amber-500 font-bold tracking-widest uppercase">
                Portal
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-bold text-slate-300">
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                My Applications
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-bold text-slate-100 block">
                {session.user?.name || "K. L. Perera"}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Citizen Account
              </span>
            </div>

            <div className="w-[1px] h-6 bg-slate-800 hidden sm:block"></div>

            <ThemeToggle />

            <div className="w-[1px] h-6 bg-slate-800 hidden sm:block"></div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page Container */}
      <main className="flex-grow flex flex-col">{children}</main>
    </div>
  );
}
