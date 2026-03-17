import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const GOV_BLUE = "#1A73E8";
const GOV_TEXT = "#2C2C2C";

function Logo({ className = "h-10 w-10" }) {
  return (
    <img
      src="/images/bhoomichain.png"
      alt="BhoomiChain logo"
      className={className}
    />
  );
}

function Icon({ d, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  properties: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  transfer: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  marketplace: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  verification: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  documents: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  registerLand: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  approvals: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  landRecords: "M4 6h16M4 10h16M4 14h16M4 18h16",
  verificationReq: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  blockchain: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  mortgage: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  propertySearch: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  collateral: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  transactions: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
  disputes: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2a7 7 0 0114 0v-2m-7 1v10",
  legal: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2a7 7 0 0114 0v-2m-7 1v10",
  fraudDashboard: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  chevronDown: "M19 9l-7 7-7-7",
};

function getSidebarNav(role) {
  const base = (label, href, iconKey) => ({ label, href, icon: <Icon d={ICONS[iconKey]} /> });
  switch (role) {
    case "CITIZEN":
      return [
        base("Dashboard", "/dashboard", "dashboard"),
        base("My Properties", "/dashboard", "properties"),
        base("Transfer Property", "/transfer", "transfer"),
        base("Marketplace", "/services", "marketplace"),
        base("Public Verification", "/verify", "verification"),
        base("Blockchain Explorer", "/explorer", "blockchain"),
        base("Documents", "/certificates", "documents"),
        base("Digital Certificate", "/certificate", "documents"),
        base("Settings", "/settings", "settings"),
      ];
    case "REGISTRAR":
      return [
        base("Dashboard", "/dashboard", "dashboard"),
        base("Register Land", "/register-land", "registerLand"),
        base("Transfer Approvals", "/applications", "approvals"),
        base("Land Records", "/reports", "landRecords"),
        base("AI Fraud Detection", "/fraud-dashboard", "fraudDashboard"),
        base("Verification Requests", "/verify", "verificationReq"),
        base("Blockchain Logs", "/reports", "blockchain"),
        base("Blockchain Explorer", "/explorer", "blockchain"),
        base("Digital Certificate", "/certificate", "documents"),
        base("Settings", "/settings", "settings"),
      ];
    case "BANK":
      return [
        base("Dashboard", "/dashboard", "dashboard"),
        base("Mortgage Management", "/mortgage", "mortgage"),
        base("Property Verification", "/verify", "propertySearch"),
        base("Loan Collateral", "/dashboard", "collateral"),
        base("Transactions", "/dashboard", "transactions"),
        base("Blockchain Explorer", "/explorer", "blockchain"),
        base("Digital Certificate", "/certificate", "documents"),
        base("Settings", "/settings", "settings"),
      ];
    case "COURT":
      return [
        base("Dashboard", "/dashboard", "dashboard"),
        base("Dispute Management", "/grievances-admin", "disputes"),
        base("Land Records", "/reports", "landRecords"),
        base("Legal Actions", "/grievances-admin", "legal"),
        base("Blockchain Logs", "/reports", "blockchain"),
        base("Blockchain Explorer", "/explorer", "blockchain"),
        base("Digital Certificate", "/certificate", "documents"),
        base("Settings", "/settings", "settings"),
      ];
    default:
      return [
        base("Dashboard", "/dashboard", "dashboard"),
        base("Settings", "/settings", "settings"),
      ];
  }
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
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
        active ? "bg-primary text-white shadow-sm" : "text-[#2C2C2C] hover:bg-gray-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className={active ? "text-white" : "text-gray-600"}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

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
      <main className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-[#2C2C2C]">Loading session...</div>
      </main>
    );
  }

  const current = router.pathname || "";
  const sidebarNav = getSidebarNav(user.role);

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-4 h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <Logo className="h-8 w-8 flex-shrink-0" />
            <span className="font-semibold text-sm sm:text-base truncate" style={{ color: GOV_TEXT }}>
              BhoomiChain – National Blockchain Land Registry
            </span>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <input
              type="search"
              placeholder="Search Property by Property ID or Survey Number"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/verify?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/notifications"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Icon d={ICONS.bell} className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                  {initials(user.name)}
                </div>
                <Icon d={ICONS.chevronDown} className="h-4 w-4 text-gray-600" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="font-medium text-sm text-[#2C2C2C] truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-[#2C2C2C] hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/account-settings"
                      className="block px-3 py-2 text-sm text-[#2C2C2C] hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <button
                      type="button"
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => { setProfileOpen(false); logout(); }}
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex lg:w-60 flex-col bg-white border-r border-gray-200">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarNav.map((item) => (
              <NavItem
                key={item.href + item.label}
                // Only highlight the true current page:
                // - Never highlight Settings from sidebar (handled by /settings route)
                // - When on /dashboard, highlight only the "Dashboard" item, not other aliases that also point to /dashboard
                active={
                  item.label !== "Settings" &&
                  !(item.href === "/dashboard" && item.label !== "Dashboard") &&
                  current === item.href
                }
                label={item.label}
                icon={item.icon}
                href={item.href}
              />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden px-4 py-3 border-b border-gray-200 bg-white">
            <input
              type="search"
              placeholder="Search Property by Property ID or Survey Number"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/verify?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
          </div>
          <div className="flex-1 py-8 px-6 lg:py-12 lg:px-10 overflow-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
