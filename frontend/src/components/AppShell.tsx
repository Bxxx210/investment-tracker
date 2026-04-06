"use client";

import Link from "next/link";
import { useState } from "react";

const navigationItems = [
  { href: "/", label: "แลกเงิน" },
  { href: "/", label: "หุ้น" },
  { href: "/", label: "สรุปภาษี" },
];

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#1f2937_0%,_#0f172a_42%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-slate-950/95 px-5 py-6 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 md:border-r md:bg-slate-950/70",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          ].join(" ")}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                Investment
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">
                Tracker
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full border border-white/10 p-2 text-slate-300 md:hidden"
              aria-label="Close navigation"
            >
              <span className="block h-4 w-4">×</span>
            </button>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item, index) => (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/5 hover:text-white"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.75)]" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
              Quick View
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              จัดการรายการแลกเงิน หุ้น และสรุปภาษีในที่เดียว
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col md:ml-0">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 px-4 py-4 backdrop-blur-xl sm:px-6 md:px-10">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
                aria-label="Open navigation"
              >
                <span className="space-y-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                </span>
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Portfolio Dashboard
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                  Investment Tracker
                </h2>
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
            {isSidebarOpen ? (
              <button
                type="button"
                className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close navigation overlay"
              />
            ) : null}
            <div className="relative z-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
