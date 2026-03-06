import Link from "next/link";
import { useRouter } from "next/router";
import { PublicShell } from "@/components/PublicShell";

const SERVICES = [
  {
    title: "Public verification",
    desc: "Verify land record status and audit trail without logging in.",
    href: "/verify",
    keywords: ["verify", "public", "certificate", "search"],
  },
  {
    title: "Citizen sign in",
    desc: "Access owned properties, applications, and certificates.",
    href: "/login",
    keywords: ["citizen", "login", "dashboard"],
  },
  {
    title: "Registration (stakeholders)",
    desc: "Create an account as Citizen / Registrar / Bank / Court.",
    href: "/register",
    keywords: ["register", "signup", "stakeholder"],
  },
  {
    title: "Applications workflow",
    desc: "Submit and track transfer applications.",
    href: "/applications",
    keywords: ["application", "transfer", "workflow"],
  },
  {
    title: "Certificates",
    desc: "View demo transfer approval certificates issued to you.",
    href: "/certificates",
    keywords: ["certificate", "approval"],
  },
  {
    title: "Grievance & helpdesk",
    desc: "Submit issues, track grievance number, and receive resolutions.",
    href: "/grievance",
    keywords: ["grievance", "help", "support"],
  },
];

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
      {q && (
        <p className="text-xs text-slate-600 mb-3">
          Showing results for <span className="font-semibold">&quot;{q}&quot;</span> (
          {filtered.length} match{filtered.length === 1 ? "" : "es"}).
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div key={s.title} className="card p-5">
            <div className="text-sm font-semibold text-slate-900">{s.title}</div>
            <div className="text-sm text-slate-700 mt-2">{s.desc}</div>
            <div className="mt-4">
              <Link className="btn btn-primary px-4 py-2 rounded-lg text-sm" href={s.href}>
                Open
              </Link>
            </div>
          </div>
        ))}
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

