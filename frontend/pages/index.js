import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export default function Home() {
  return (
    <PublicShell
      title="National Land Registry Portal"
      subtitle="Single-window access to land records, citizen services, and public verification in a government-style interface."
    >
      <div className="space-y-8">
        {/* Hero section – bold headline like reference image, but in gov theme */}
        <section className="rounded-xl bg-gradient-to-r from-slate-50 via-white to-slate-100 border border-slate-200 px-6 py-10 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Secure Land Registry in India
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-700 max-w-xl mx-auto lg:mx-0">
              A tamper‑aware, auditable ledger designed to prevent disputes, ensure transparency,
              and secure property ownership for every citizen.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/register" className="btn btn-primary px-6 py-3 rounded-lg text-sm font-semibold">
                Start Registration
              </Link>
              <Link href="/login" className="btn btn-secondary px-6 py-3 rounded-lg text-sm font-semibold">
                Authority Portal
              </Link>
              <Link href="/verify" className="btn btn-secondary px-6 py-3 rounded-lg text-sm font-semibold">
                Public Verification
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link href="/login" className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center hover:shadow-sm transition">
                <div className="text-2xl mb-1">👤</div>
                <div className="text-sm font-semibold text-slate-900">Citizen</div>
                <div className="text-[11px] text-slate-600 mt-1">View land &amp; applications</div>
              </Link>
              <Link href="/login" className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center hover:shadow-sm transition">
                <div className="text-2xl mb-1">🏛️</div>
                <div className="text-sm font-semibold text-slate-900">Registrar</div>
                <div className="text-[11px] text-slate-600 mt-1">Approve registrations</div>
              </Link>
              <Link href="/login" className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center hover:shadow-sm transition">
                <div className="text-2xl mb-1">🏦</div>
                <div className="text-sm font-semibold text-slate-900">Bank</div>
                <div className="text-[11px] text-slate-600 mt-1">Lock / release mortgage</div>
              </Link>
              <Link href="/login" className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center hover:shadow-sm transition">
                <div className="text-2xl mb-1">⚖️</div>
                <div className="text-sm font-semibold text-slate-900">Court</div>
                <div className="text-[11px] text-slate-600 mt-1">Freeze during litigation</div>
              </Link>
              <Link href="/verify" className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center hover:shadow-sm transition">
                <div className="text-2xl mb-1">🔍</div>
                <div className="text-sm font-semibold text-slate-900">Public verify</div>
                <div className="text-[11px] text-slate-600 mt-1">Check any property / Tx</div>
              </Link>
              <Link href="/services" className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center hover:shadow-sm transition">
                <div className="text-2xl mb-1">📂</div>
                <div className="text-sm font-semibold text-slate-900">All services</div>
                <div className="text-[11px] text-slate-600 mt-1">Directory of features</div>
              </Link>
            </div>
          </div>
        </section>

        {/* Services + announcements layout */}
        <section className="grid lg:grid-cols-9 gap-4">
          <div className="lg:col-span-5 card p-5">
            <div className="text-sm font-semibold text-slate-900">Online services</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <Link href="/services" className="text-primary font-semibold hover:underline">
                  Services directory
                </Link>{" "}
                – browse citizen and stakeholder services.
              </li>
              <li>
                <Link href="/applications" className="text-primary font-semibold hover:underline">
                  Applications workflow
                </Link>{" "}
                – submit and track transfer requests.
              </li>
              <li>
                <Link href="/certificates" className="text-primary font-semibold hover:underline">
                  Certificates
                </Link>{" "}
                – view demo approval certificates.
              </li>
              <li>
                <Link href="/grievance" className="text-primary font-semibold hover:underline">
                  Grievance &amp; helpdesk
                </Link>{" "}
                – submit issues to the registry.
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 card p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">Announcements</div>
                <div className="text-[11px] text-slate-500">Recent updates in the land registry demo</div>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-800">
                Demo only
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              <div className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
                <div className="font-semibold text-slate-900">Online transfer applications</div>
                <div className="mt-1">
                  Citizens can now submit land transfer applications online and track status until
                  registrar approval. Approved transfers automatically update ownership records and
                  generate a certificate.
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
                <div className="font-semibold text-slate-900">Mortgage &amp; litigation modules</div>
                <div className="mt-1">
                  Bank and Court dashboards include dedicated panels to place mortgage locks and
                  litigation freezes on properties, preventing risky or disputed transfers.
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
                <div className="font-semibold text-slate-900">Public land record verification</div>
                <div className="mt-1">
                  Members of the public can verify current ownership, mortgage and litigation status
                  of a property using its ID or transaction number, with a full blockchain audit
                  trail.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Extra “How it works” strip */}
        <section className="card p-5">
          <div className="text-sm font-semibold text-slate-900 mb-2">How this demo works</div>
          <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
            <li>Sign in using the demo credentials on the Sign in page.</li>
            <li>Registrar registers a demo property for a citizen.</li>
            <li>Citizen submits a transfer application; Registrar approves it.</li>
            <li>Bank and Court toggle mortgage and litigation flags on the same property.</li>
            <li>Use Public verification to see the full, immutable audit trail for that property.</li>
          </ol>
        </section>
      </div>
    </PublicShell>
  );
}
