import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1v6H4a1 1 0 0 1-1-1V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFile(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v4a1 1 0 0 0 1 1h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h6M9 15h6M9 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function NavItem({ active, icon, label, href }) {
  return (
    <Link
      href={href}
      className={[
        "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={[
          "h-9 w-9 rounded-lg flex items-center justify-center border",
          active
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200 text-slate-600",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("bhoomi_token");
      const stored = window.localStorage.getItem("bhoomi_user");
      if (!token || !stored) {
        window.localStorage.removeItem("bhoomi_token");
        window.localStorage.removeItem("bhoomi_user");
        router.replace("/login");
        return;
      }
      setUser(JSON.parse(stored));
    }
  }, [router]);

  function logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("bhoomi_token");
      window.localStorage.removeItem("bhoomi_user");
    }
    router.push("/login");
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading session...</div>
      </main>
    );
  }

  const envLabel = process.env.NEXT_PUBLIC_ENV_LABEL || "DEMO";

  const current = router.pathname || "";

  return (
    <main className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
              BC
            </div>
            <div>
              <div className="font-semibold text-slate-900 leading-tight">
                BhoomiChain
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                Land Registry · {envLabel}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2 px-2">
            Workspace
          </div>
          <NavItem
            active={current === "/dashboard"}
            label="Dashboard"
            icon={<IconHome className="h-5 w-5" />}
            href="/dashboard"
          />
          <NavItem
            active={current === "/applications"}
            label="Applications"
            icon={<IconFile className="h-5 w-5" />}
            href="/applications"
          />
          <NavItem
            active={current === "/certificates"}
            label="Certificates"
            icon={<IconFile className="h-5 w-5" />}
            href="/certificates"
          />
          <NavItem
            active={current === "/verify"}
            label="Public Verification"
            icon={<IconCheck className="h-5 w-5" />}
            href="/verify"
          />
        </nav>
        <div className="px-4 py-4 border-t border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
            {initials(user.name)}
          </div>
          <div className="text-xs flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">
              {user.name}
            </div>
            <div className="text-slate-500 truncate">{user.role}</div>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-xs hover:bg-slate-50"
            type="button"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">BhoomiChain</div>
              <div className="text-[11px] text-slate-500 uppercase">
                Land Registry · {envLabel}
              </div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs"
              type="button"
            >
              Logout
            </button>
          </div>
        </header>
        <div className="max-w-6xl mx-auto w-full px-4 py-6">{children}</div>
      </div>
    </main>
  );
}
