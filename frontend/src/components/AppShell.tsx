"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  emoji: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Chat", emoji: "💬" },
  { href: "/summary", label: "สรุป", emoji: "📊" },
  { href: "/settings", label: "ตั้งค่า", emoji: "⚙️" },
];

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#1f2937_0%,_#0f172a_42%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/75 px-5 py-6 backdrop-blur-xl md:flex md:flex-col">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
              Investment
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Tracker
            </h1>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                  isActive(item.href)
                    ? "border-cyan-400/30 bg-cyan-400/15 text-white shadow-[0_10px_30px_rgba(34,211,238,0.12)]"
                    : "border-transparent text-slate-300 hover:border-cyan-400/30 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <span className="text-cyan-300">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
              Quick View
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              คุยกับบอทเพื่อบันทึก แลกเงิน หุ้น และดูสรุปภาษีในที่เดียว
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 px-4 py-4 backdrop-blur-xl sm:px-6 md:px-10">
            <div className="flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-[0.65rem] uppercase tracking-[0.32em] text-slate-400">
                  Portfolio Chat
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                  Investment Tracker
                </h2>
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-4 py-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:px-10 md:pb-8">
            <div className="relative z-10">{children}</div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition",
                isActive(item.href)
                  ? "bg-cyan-400/15 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.12)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span className={isActive(item.href) ? "text-cyan-300" : "text-slate-400"}>
                {item.emoji}
              </span>
              <span className="text-[0.72rem] leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
