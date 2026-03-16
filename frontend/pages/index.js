import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Government-grade landing: BhoomiChain — India's Blockchain Land Registry (light mode, government palette)

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#technology", label: "Technology" },
  { href: "#impact", label: "Impact" },
  { href: "/demo-portal", label: "Demo Portal" },
];

const PROBLEM_STATS = [
  { value: "66%", label: "of civil court cases in India are land disputes." },
  { value: "₹2 Lakh Crore", label: "lost annually due to land fraud and litigation." },
  { value: "Millions of families", label: "lose property due to forged documents." },
];

const FEATURES_GRID = [
  { title: "Immutable Ownership Records", desc: "Land ownership stored permanently on blockchain.", icon: "🔒" },
  { title: "Smart Contract Transfers", desc: "Secure ownership transfers executed through smart contracts.", icon: "📜" },
  { title: "Mortgage Lock System", desc: "Banks can lock property during active loans.", icon: "🏦" },
  { title: "Litigation Freeze", desc: "Courts can freeze disputed lands to prevent illegal transfers.", icon: "⚖️" },
  { title: "IPFS Document Storage", desc: "Land documents stored securely using decentralized storage.", icon: "📁" },
  { title: "Public Verification", desc: "Anyone can verify land ownership through QR code or transaction ID.", icon: "✓" },
];

const WORKFLOW_STEPS = [
  { step: 1, title: "Land Registration", desc: "Registrar creates a digital land asset on blockchain.", icon: "📋" },
  { step: 2, title: "Digital Ownership", desc: "Owners access property details and track ownership history.", icon: "👤" },
  { step: 3, title: "Mortgage Control", desc: "Banks apply mortgage locks during active loans.", icon: "🔐" },
  { step: 4, title: "Litigation Freeze", desc: "Courts mark disputed lands.", icon: "⚖️" },
  { step: 5, title: "Secure Transfer", desc: "Ownership transfers executed through smart contracts.", icon: "🔄" },
];

const TECH_STACK = [
  { name: "Hyperledger Fabric", desc: "Permissioned blockchain for land ledger.", logo: "⛓️" },
  { name: "Smart Contracts", desc: "Node.js / Solidity logic for transfers.", logo: "📜" },
  { name: "IPFS Storage", desc: "Decentralized document storage.", logo: "📂" },
  { name: "React Frontend", desc: "Modern UI for portals.", logo: "⚛️" },
  { name: "Node.js Backend", desc: "REST API and auth.", logo: "🟢" },
  { name: "PostgreSQL", desc: "Reliable data persistence.", logo: "🐘" },
];

const IMPACT_CARDS = [
  { title: "Fraud Prevention", desc: "Tamper-proof records reduce forgery and duplicate sales." },
  { title: "Transparent Land Records", desc: "Single source of truth for ownership and history." },
  { title: "Reduced Court Backlog", desc: "Fewer disputes with verifiable digital proof." },
  { title: "Secure Financial Lending", desc: "Banks can safely use land as collateral." },
];

const FOOTER_LINKS = [
  { label: "About", href: "#home" },
  { label: "Technology", href: "#technology" },
  { label: "Documentation", href: "/demo" },
  { label: "Contact", href: "/login" },
];

const PRIMARY = "#0B3C5D";

const LandingMap = dynamic(() => import("../components/LandingMap"), { ssr: false });

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#2C2C2C]">
      {/* SECTION 1 — NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-slate-900 hover:opacity-90 transition">
            <img
              src="/images/bhoomichain.png"
              alt="BhoomiChain logo"
              className="h-16 w-20 object-contain"
            />
            <span className="font-bold text-lg tracking-tight">BhoomiChain</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) =>
              href.startsWith("#") ? (
                <a
                  key={href}
                  href={href}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary transition rounded-md"
                >
                  {label}
                </a>
              ) : (
                <Link key={href} href={href} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary transition rounded-md">
                  {label}
                </Link>
              )
            )}
            <Link
              href="/login"
              className="ml-4 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold border border-primary text-primary hover:bg-primary/5 transition"
            >
              Register
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-semibold border border-primary text-primary">
              Register
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 flex flex-col gap-1 shadow-lg">
            {NAV_LINKS.map(({ href, label }) =>
              href.startsWith("#") ? (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary rounded-md">
                  {label}
                </a>
              ) : (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary rounded-md">
                  {label}
                </Link>
              )
            )}
          </div>
        )}
      </nav>

      {/* SECTION 2 — HERO */}
      <section id="home" className="relative pt-24 pb-20 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28 overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in opacity-0" style={{ animationFillMode: "forwards" }}>
              <div className="mb-4 inline-flex items-center gap-3">
                <img
                  src="/images/bhoomichain.png"
                  alt="BhoomiChain logo"
                  className="h-14 w-14 object-contain"
                />
                <span className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
                  Transforming land into digital assets.
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-[#0B3C5D]">
                BhoomiChain — India&apos;s Blockchain Land Registry
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-slate-700 font-medium">
                A secure digital infrastructure for tamper-proof land ownership and transparent property transactions.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed max-w-xl">
                BhoomiChain brings together land records, GIS maps, and blockchain to give citizens, banks, and courts a single, trusted view of every property.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-semibold text-white"
                  style={{ backgroundColor: "#0B3C5D" }}
                >
                  Explore Portal
                </Link>
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-semibold border border-[#0B3C5D] text-[#0B3C5D] hover:bg-[#0B3C5D]/5 transition"
                >
                  Verify Land Record
                </Link>
              </div>
              <Link href="/demo" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition">
                Watch Demo →
              </Link>
            </div>
            <div className="animate-fade-in flex justify-center opacity-0" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
              <img
                src="/images/hero-land-map.png"
                alt="Digital land parcel map on BhoomiChain"
                className="w-full max-w-md rounded-xl shadow-lg border border-slate-200 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-[#0B3C5D] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-4 items-center justify-between text-sm">
          <span className="font-semibold">Built for Transparent Land Governance</span>
          <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              🔐 <span>Blockchain Security</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              🗺️ <span>GIS Mapping</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              🆔 <span>Digital Identity (Aadhaar)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              📁 <span>IPFS Document Storage</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              🏛️ <span>Government Registry</span>
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PROBLEM */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            The Land Dispute Crisis in India
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {PROBLEM_STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm hover:border-primary/30 hover:shadow-md transition duration-300"
              >
                <div className="text-2xl sm:text-3xl font-bold text-primary">{value}</div>
                <p className="mt-3 text-sm text-slate-600">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Most land records in India are still paper-based and fragmented across departments, making them vulnerable to tampering, fraud, and disputes.
          </p>
        </div>
      </section>

      {/* SECTION 3b — SOLUTION OVERVIEW */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#2C2C2C] mb-6">
            The BhoomiChain Solution
          </h2>
          <p className="max-w-3xl mx-auto text-center text-slate-600 leading-relaxed">
            A single, tamper-proof digital land registry on blockchain. Every property gets a unique record; ownership changes, mortgage locks, and court freezes are recorded immutably. Citizens, banks, and courts access one source of truth—reducing fraud, disputes, and delays.
          </p>
          <div className="mt-8 flex justify-center">
            <img
              src="/images/land-registry-workflow.png"
              alt="End-to-end land registry workflow on BhoomiChain"
              className="w-full max-w-3xl rounded-lg shadow-md border border-slate-200"
            />
          </div>
        </div>
      </section>

      {/* SECTION 4 — FEATURES */}
      <section id="features" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            A Blockchain Infrastructure for Trusted Land Governance
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_GRID.map(({ title, desc, icon }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <span className="text-2xl" aria-hidden="true">{icon}</span>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — HOW IT WORKS (GOVERNMENT WORKFLOW) */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">How BhoomiChain Works</h2>
          <p className="text-sm text-slate-600 mb-8 max-w-2xl">
            BhoomiChain mirrors the way government land registries work today, while adding blockchain transparency and GIS intelligence.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Land Registration", desc: "Citizen submits land details and ownership proof." },
              { step: "2", title: "Verification", desc: "Government authority verifies documents and identity." },
              { step: "3", title: "Blockchain Recording", desc: "Verified ownership data is hashed and stored on blockchain." },
              { step: "4", title: "Public Verification", desc: "Anyone can verify land records using survey number." },
              { step: "5", title: "Secure Transfer", desc: "Ownership transfers occur with transparent audit trails." },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col">
                <div
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white mb-2"
                  style={{ backgroundColor: "#1A4D8F" }}
                >
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <img
              src="/images/land-dashboard.png"
              alt="Digital land record dashboard"
              className="w-full rounded-lg shadow-md border border-slate-200"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Digital Land Record Dashboard</h2>
            <p className="text-sm text-slate-600 mb-4">
              Role-based dashboards for citizens, registrars, banks, and courts.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• View verified land ownership</li>
              <li>• Survey number lookup</li>
              <li>• Blockchain transaction history</li>
              <li>• Mortgage and dispute flags</li>
              <li>• Tamper-proof property registry</li>
            </ul>
          </div>
        </div>
      </section>

      {/* STATISTICS STRIP */}
      <section className="py-10 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6">
            Digitizing India&apos;s Land Records
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "10M+", label: "Land Records Digitized" },
              { value: "500K+", label: "Ownership Transfers" },
              { value: "50K+", label: "Verified Plots" },
              { value: "99.9%", label: "Data Integrity" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="text-2xl sm:text-3xl font-bold text-[#0B3C5D]">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAND VISUAL IMPACT */}
      <section id="impact" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <img
              src="/images/land-plots-aerial.jpg"
              alt="Aerial view of land plots"
              className="w-full rounded-lg shadow-md border border-slate-200 object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Transforming Land Governance</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Eliminates land ownership fraud</li>
              <li>• Reduces property disputes</li>
              <li>• Enables transparent governance</li>
              <li>• Accelerates land registration process</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Search Land Records by Map
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-2xl">
            Click a parcel to preview survey number, owner, and blockchain transaction details.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-80">
            <LandingMap />
          </div>
        </div>
      </section>

      {/* SECTION 6 — TECHNOLOGY STACK */}
      <section id="technology" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            Technology Powering BhoomiChain
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TECH_STACK.map(({ name, desc, logo }) => (
              <div
                key={name}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 hover:border-primary/30 hover:shadow-md transition duration-300"
              >
                <span className="text-2xl" aria-hidden="true">{logo}</span>
                <h3 className="mt-3 font-semibold text-slate-900">{name}</h3>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOVERNMENT-STYLE FOOTER */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-5 gap-6 text-xs text-slate-700">
          <div className="sm:col-span-2">
            <h3 className="font-semibold mb-2">About BhoomiChain</h3>
            <p className="text-slate-600">
              BhoomiChain is a digital land registry innovation prototype that demonstrates how blockchain and GIS can secure land records.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Technology</h3>
            <ul className="space-y-1">
              <li>Hyperledger Fabric</li>
              <li>GIS Mapping</li>
              <li>IPFS Documents</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Citizen Portal</h3>
            <ul className="space-y-1">
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/register">Register</Link></li>
              <li><Link href="/services">Services</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Verify Land Record</h3>
            <ul className="space-y-1">
              <li><Link href="/verify">Public Verification</Link></li>
              <li><Link href="/explorer">Blockchain Explorer</Link></li>
              <li><Link href="/demo">Demo Walkthrough</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>© BhoomiChain — Digital Land Registry Innovation Prototype</span>
            <span>For demonstration of government-grade digital land governance.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
