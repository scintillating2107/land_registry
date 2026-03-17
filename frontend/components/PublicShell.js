import { useEffect, useState } from "react" ;
import Link from "next/link";
import { useRouter } from "next/router";

function GovEmblem() {
  return (
    <div className="h-12 w-12 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
      <img
        src="/images/bhoomichain.png"
        alt="BhoomiChain logo"
        className="h-10 w-10 object-contain"
      />
    </div>
  );
}

export function PublicShell({ title, subtitle, children, hideQuickLinks }) {
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

  const quickLinks = [
    { href: "/verify", label: "Land Map & Verification", icon: "🗺️" },
    { href: "/explorer", label: "Blockchain Explorer", icon: "⛓️" },
    { href: "/applications", label: "Transfer Workflow", icon: "📄" },
    { href: "/grievance", label: "Disputes & Helpdesk", icon: "⚖️" },
    { href: "/services", label: "All Features", icon: "✨" },
    { href: "/demo", label: "Demo Mode", icon: "🎯" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
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
            <div className="flex items-center gap-2">
              <input
                className="input text-sm w-64 pr-2"
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
              <span className="text-slate-400 text-xs whitespace-nowrap">Ctrl+K</span>
            </div>
          </div>
        </div>

        {/* Primary navigation (simple) */}
        <nav className="bg-primary text-white">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/">
              Overview
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/verify">
              Land Map
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/applications">
              Workflow
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/grievance">
              Disputes
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/services">
              Features
            </Link>
            <Link className="px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/register">
              Register
            </Link>
            <Link className="ml-auto px-3 py-2 text-sm hover:bg-primaryDark whitespace-nowrap" href="/login">
              Authority Portal
            </Link>
          </div>
        </nav>
      </header>

      <section id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {!hideQuickLinks && (
          <div className="mb-5 flex flex-wrap gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-primary hover:text-primary transition"
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
        {(title || subtitle) && (
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
        )}

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

