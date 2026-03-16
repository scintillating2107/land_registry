import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

const STEPS = [
  {
    icon: "🏛️",
    title: "Register a parcel",
    detail: "Registrar creates a property record for a citizen and anchors it to blockchain-backed history.",
    href: "/login",
    cta: "Open Authority Portal",
  },
  {
    icon: "🤖",
    title: "Upload and verify documents",
    detail: "Citizen uploads a sale deed. AI checks for fake signatures, metadata mismatch, and tampering signals.",
    href: "/applications",
    cta: "Open Workflow",
  },
  {
    icon: "🚨",
    title: "Detect risky activity",
    detail: "Fraud engine flags duplicate sale windows, owner mismatch, active mortgage, litigation, and disputed parcels.",
    href: "/verify",
    cta: "Open Fraud View",
  },
  {
    icon: "🔐",
    title: "Execute smart transfer",
    detail: "Transfer runs only when identity, mortgage, litigation, and dispute checks all pass.",
    href: "/applications",
    cta: "See Smart Logic",
  },
  {
    icon: "🗺️",
    title: "Show one source of truth",
    detail: "Judges can inspect parcel map, NFT-style token identity, and immutable ownership timeline on one screen.",
    href: "/verify",
    cta: "Open Land Map",
  },
];

export default function DemoPage() {
  return (
    <PublicShell
      title="Hackathon Demo Flow"
      subtitle="A judge-friendly walkthrough for showing problem, technology, trust, and impact in a clean story."
    >
      <div className="space-y-6">
        <section className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 card p-5">
            <div className="text-sm font-semibold text-slate-900">Opening line</div>
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 text-lg font-semibold text-violet-900">
              Our system ensures One Land - One Truth, where ownership history cannot be altered or manipulated.
            </div>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-2xl">🗺️</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">Visual proof</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Parcel map + ownership</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-2xl">🛡️</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">Trust layer</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Fraud alerts + approvals</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-2xl">⛓️</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">Audit trail</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Immutable timeline</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/70">Live showcase</div>
                <div className="mt-1 text-lg font-semibold">Judge visual preview</div>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs">Demo</div>
            </div>
            <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 rounded-xl bg-emerald-300/20 p-3">
                  <div className="text-xs text-emerald-100">Land map</div>
                  <div className="mt-3 h-24 rounded-lg bg-gradient-to-br from-emerald-200/30 to-emerald-500/20 p-3">
                    <div className="h-full rounded-lg border border-dashed border-emerald-100/60 bg-emerald-100/10" />
                  </div>
                </div>
                <div className="rounded-xl bg-red-300/20 p-3">
                  <div className="text-xs text-red-100">Risk</div>
                  <div className="mt-3 rounded-lg bg-red-100/10 px-2 py-3 text-center text-2xl">78</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-xs text-white/70">Aadhaar</div>
                  <div className="mt-3 text-lg">✅</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-xs text-white/70">Bank lock</div>
                  <div className="mt-3 text-lg">⚠️</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-xs text-white/70">NFT ID</div>
                  <div className="mt-3 text-lg">🔷</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-5 gap-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {step.icon}
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs uppercase tracking-wide text-slate-500">
                  Step {index + 1}
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{step.title}</div>
              <div className="mt-2 text-sm text-slate-700">{step.detail}</div>
              <div className="mt-4">
                <Link href={step.href} className="btn btn-primary px-4 py-2 rounded-lg text-sm">
                  {step.cta}
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">🗺️</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Map preview</div>
                <div className="text-xs text-slate-500">Parcel-first experience</div>
              </div>
            </div>
            <div className="mt-4 h-40 rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
              <div className="grid h-full grid-cols-4 gap-2">
                <div className="col-span-3 rounded-xl border border-emerald-200 bg-emerald-100/70" />
                <div className="space-y-2">
                  <div className="h-10 rounded-lg bg-white border border-slate-200" />
                  <div className="h-10 rounded-lg bg-white border border-slate-200" />
                  <div className="h-10 rounded-lg bg-white border border-slate-200" />
                </div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">🚨</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Fraud console</div>
                <div className="text-xs text-slate-500">Risk explained visually</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-red-900">Duplicate sale risk</div>
                  <div className="text-xs font-semibold text-red-700">HIGH</div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-amber-900">Mortgage conflict</div>
                  <div className="text-xs font-semibold text-amber-700">MEDIUM</div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-emerald-900">Verified owner match</div>
                  <div className="text-xs font-semibold text-emerald-700">PASS</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">⛓️</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">History timeline</div>
                <div className="text-xs text-slate-500">Ownership shown as events</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {["Registered", "Mortgaged", "Dispute raised", "Transfer approved"].map((item, idx) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    {idx + 1}
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-sm font-semibold text-slate-900">{item}</div>
                    <div className="text-xs text-slate-500">Immutable event log</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-900">What judges should notice</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Fraud prevention is proactive, not just record keeping.</li>
              <li>Government integrations make the system realistic.</li>
              <li>GIS map plus timeline makes ownership transparent.</li>
            </ul>
          </div>
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-900">Best live demo path</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Show a risky parcel with mortgage or dispute alert.</li>
              <li>Show the AI document verification panel.</li>
              <li>Show the smart contract guardrails before transfer.</li>
            </ul>
          </div>
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-900">Close with impact</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Reduces fake ownership and duplicate sale fraud.</li>
              <li>Improves transparency for citizens and banks.</li>
              <li>Scales to districts, states, and institutions.</li>
            </ul>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
