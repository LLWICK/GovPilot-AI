import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh h-dvh w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <main className="flex-grow flex flex-col min-w-0 h-full relative overflow-hidden">{children}</main>
    </div>
  );
}
