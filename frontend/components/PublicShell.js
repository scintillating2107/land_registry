import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

function GovEmblem() {
  return (
    <div className="h-12 w-12 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Z"
          stroke="#0f172a"
          strokeWidth="1.3"
        />
        <path
          d="M12 6v12M6 12h12M8 8l8 8M16 8l-8 8"
          stroke="#0f172a"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

export function PublicShell({ title, subtitle, children }) {
  const envLabel = process.env.NEXT_PUBLIC_ENV_LABEL || "DEMO";
  const [fontStep, setFontStep] = useState(0); // -1,0,1
  const [today, setToday] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("gov_font_step");
    const parsed = saved ? Number(saved) : 0;
    if (Number.isFinite(parsed)) setFontStep(Math.max(-1, Math.min(1, parsed)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gov_font_step", String(fontStep));
    const base = 16;
    const size = base + fontStep * 1.5;
    document.documentElement.style.fontSize = `${size}px`;
  }, [fontStep]);

  useEffect(() => {
    // Avoid SSR/client mismatch: compute date on client only.
    setToday(new Date().toLocaleDateString());
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Accessibility / utility bar (India.gov-like) */}
      <div className="bg-slate-100 border-b border-slate-200 text-xs">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <a
            href="#main-content"
            className="gov-link px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Skip to main content
          </a>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="hidden sm:inline">Text size:</span>
            <button
              type="button"
              className="gov-link px-2 py-1 rounded border border-slate-200 bg-white"
              onClick={() => setFontStep(-1)}
              aria-label="Decrease text size"
              title="A-"
            >
              A-
            </button>
            <button
              type="button"
              className="gov-link px-2 py-1 rounded border border-slate-200 bg-white"
              onClick={() => setFontStep(0)}
              aria-label="Reset text size"
              title="A"
            >
              A
            </button>
            <button
              type="button"
              className="gov-link px-2 py-1 rounded border border-slate-200 bg-white"
              onClick={() => setFontStep(1)}
              aria-label="Increase text size"
              title="A+"
            >
              A+
            </button>
            <span className="hidden md:inline text-slate-500 mx-2">|</span>
            <span className="hidden md:inline text-slate-600" suppressHydrationWarning>
              Date: {today || "—"}
            </span>
            <span className="hidden md:inline text-slate-500 mx-2">|</span>
            <span className="hidden md:inline text-slate-600">
              Environment: {envLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Tricolor accent */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <GovEmblem />
            <div className="min-w-0">
              <div className="text-xs text-slate-600 uppercase tracking-wide">
                Government of India · Land Resources (Demo)
              </div>
              <div className="font-bold text-slate-900 leading-tight truncate">
                BhoomiChain Land Registry
              </div>
              <div className="text-xs text-slate-600 truncate">
                National portal for land records, transfers, and public verification
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <input
                className="input text-sm w-72"
                placeholder="Search services (e.g. transfer, verify)"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const q = search.trim();
                    if (q) {
                      router.push(`/services?search=${encodeURIComponent(q)}`);
                    }
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                Ctrl+K
              </div>
            </div>
          </div>
        </div>

        {/* Primary navigation (simple) */}
        <nav className="bg-primary text-white">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/">
              Home
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/verify">
              Public Verification
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/register">
              Register
            </Link>
            <Link className="ml-auto px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/login">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <section id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-slate-600 mt-2 max-w-2xl">{subtitle}</p>
          )}
        </div>

        {children}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-600 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} National Land Registry Portal (Demo)</div>
          <div className="text-slate-500">
            This is a demonstration portal. Content is illustrative only.
          </div>
        </div>
      </footer>
    </main>
  );
}

