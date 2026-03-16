import Link from "next/link";
import { useRouter } from "next/router";
import { PublicShell } from "@/components/PublicShell";

const SERVICE_SECTIONS = [
  {
    title: "Citizen Experience",
    icon: "🧑",
    items: [
      {
        icon: "🗺️",
        title: "GIS land map",
        desc: "Search land by property or owner and open a highlighted map plot with blockchain proof.",
        href: "/verify",
        keywords: ["map", "gis", "land", "plot", "visualization"],
      },
      {
        icon: "🔎",
        title: "Public verification",
        desc: "Verify land record status and audit trail without logging in.",
        href: "/verify",
        keywords: ["verify", "public", "certificate", "search"],
      },
      {
        icon: "📄",
        title: "Applications workflow",
        desc: "Submit and track transfer applications.",
        href: "/applications",
        keywords: ["application", "transfer", "workflow"],
      },
      {
        icon: "⚖️",
        title: "Disputes & helpdesk",
        desc: "Raise disputes, attach evidence, and track grievance resolution.",
        href: "/grievance",
        keywords: ["grievance", "help", "support", "dispute"],
      },
    ],
  },
  {
    title: "Trust & Automation",
    icon: "🛡️",
    items: [
      {
        icon: "🚨",
        title: "Fraud risk engine",
        desc: "Inspect duplicate-sale risk, owner mismatch, mortgage blocks, and dispute alerts.",
        href: "/verify",
        keywords: ["fraud", "risk", "duplicate sale", "owner mismatch"],
      },
      {
        icon: "🏢",
        title: "Government verification simulation",
        desc: "Show Aadhaar, DigiLocker, and bank-mortgage checks before blockchain registration.",
        href: "/applications",
        keywords: ["aadhaar", "digilocker", "bank", "government", "verification"],
      },
      {
        icon: "🏅",
        title: "Certificates",
        desc: "View demo transfer approval certificates issued to you.",
        href: "/certificates",
        keywords: ["certificate", "approval"],
      },
    ],
  },
  {
    title: "Stakeholder Access",
    icon: "🤝",
    items: [
      {
        icon: "👤",
        title: "Citizen sign in",
        desc: "Access owned properties, applications, and certificates.",
        href: "/login",
        keywords: ["citizen", "login", "dashboard"],
      },
      {
        icon: "📝",
        title: "Registration (stakeholders)",
        desc: "Create an account as Citizen / Registrar / Bank / Court.",
        href: "/register",
        keywords: ["register", "signup", "stakeholder"],
      },
    ],
  },
];

const SERVICES = SERVICE_SECTIONS.flatMap((section) => section.items);

export default function ServicesPage() {
  const router = useRouter();
  const q = typeof router.query.search === "string" ? router.query.search.trim() : "";
  const normalized = q.toLowerCase();

  const filtered =
    normalized === ""
      ? SERVICES
      : SERVICES.filter((s) => {
          const haystack = `${s.title} ${s.desc} ${(s.keywords || []).join(" ")}`.toLowerCase();
          return haystack.includes(normalized);
        });

  return (
    <PublicShell
      title="Services Directory"
      subtitle="Browse citizen and stakeholder services available on this portal."
    >
      <div className="mb-6 grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl">🗺️</div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Visual access</div>
              <div className="text-sm font-semibold text-slate-900">Map-led verification</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">🚨</div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Trust layer</div>
              <div className="text-sm font-semibold text-slate-900">Fraud and dispute controls</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">⚙️</div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Automation</div>
              <div className="text-sm font-semibold text-slate-900">Government workflow simulation</div>
            </div>
          </div>
        </div>
      </div>

      {q && (
        <p className="text-xs text-slate-600 mb-3">
          Showing results for <span className="font-semibold">&quot;{q}&quot;</span> (
          {filtered.length} match{filtered.length === 1 ? "" : "es"}).
        </p>
      )}
      <div className="space-y-6">
        {!q &&
          SERVICE_SECTIONS.map((section) => (
            <section key={section.title}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {section.icon}
                </div>
                <div className="text-sm font-semibold text-slate-900">{section.title}</div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {section.items.map((s) => (
                  <div key={s.title} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        {s.icon}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
                        {section.title}
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">{s.title}</div>
                    <div className="text-sm text-slate-700 mt-2">{s.desc}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(s.keywords || []).slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Link className="btn btn-primary px-4 py-2 rounded-lg text-sm" href={s.href}>
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

        {q && (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div key={s.title} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                    <div className="text-sm text-slate-700 mt-2">{s.desc}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(s.keywords || []).slice(0, 4).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <Link className="btn btn-primary px-4 py-2 rounded-lg text-sm" href={s.href}>
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-sm text-slate-600">
            No services matched your search. Try a simpler keyword like &quot;verify&quot; or
            &quot;application&quot;.
          </div>
        )}
      </div>
    </PublicShell>
  );
}

