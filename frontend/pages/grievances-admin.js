import { useEffect, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();

const FILTERS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
];

export default function GrievancesAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("OPEN");

  async function load(status) {
    setLoading(true);
    setError("");
    try {
      const url =
        status && status !== "ALL"
          ? `${API_BASE}/api/grievances?status=${encodeURIComponent(status)}`
          : `${API_BASE}/api/grievances`;
      const res = await axios.get(url, { headers: getAuthHeaders() });
      setItems(res.data.grievances || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load grievances");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function closeOne(id) {
    setError("");
    try {
      await axios.post(
        `${API_BASE}/api/grievances/${id}/close`,
        { resolutionNote: "Resolved in demo." },
        { headers: getAuthHeaders() }
      );
      await load(filter);
    } catch (e) {
      setError(e.response?.data?.message || "Could not close grievance");
    }
  }

  function isDispute(subject = "") {
    return subject.includes("OWNERSHIP_DISPUTE") ||
      subject.includes("DOCUMENT_FORGERY") ||
      subject.includes("ILLEGAL_SALE") ||
      subject.includes("MORTGAGE_CONFLICT") ||
      subject.includes("BOUNDARY_ISSUE");
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputes &amp; grievances</h1>
          <p className="mt-1 text-sm text-slate-600">
            Registrar console to review public complaints, forged‑document alerts, and land ownership disputes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-500">Filter by status:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1 gap-0.5">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === value
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 border border-slate-200/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Triage focus</div>
          <p className="text-sm text-slate-800 leading-relaxed">
            Review ownership disputes and forged-document reports first.
          </p>
        </div>
        <div className="card p-4 border border-slate-200/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Workflow</div>
          <p className="text-sm text-slate-800 leading-relaxed">
            Read the ticket, check property status and history, then add a resolution note.
          </p>
        </div>
        <div className="card p-4 border border-slate-200/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Trust signal</div>
          <p className="text-sm text-slate-800 leading-relaxed">
            Visible dispute handling builds confidence for citizens, banks, and courts.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading && <div className="card p-4 text-sm text-slate-600">Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="card p-4 text-sm text-slate-600">No grievances found.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((g) => (
            <div key={g.id} className="card p-5 border border-slate-200/80 rounded-lg">
              {/* Header: number, status, date */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="font-semibold text-slate-900">{g.grievance_no}</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      g.status === "OPEN"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {g.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(g.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Type badges */}
              <div className="flex flex-wrap gap-2 pt-3 pb-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {isDispute(g.subject) ? "Dispute" : "Grievance"}
                </span>
                {isDispute(g.subject) && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                    High attention
                  </span>
                )}
              </div>

              {/* Details in clear rows */}
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Subject</dt>
                  <dd className="text-slate-900">{g.subject}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">From</dt>
                  <dd className="text-slate-800">{g.name} &lt;{g.email}&gt;</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Message</dt>
                  <dd className="text-slate-800 whitespace-pre-wrap">{g.message}</dd>
                </div>
                {g.resolution_note && (
                  <div>
                    <dt className="text-slate-500 font-medium mb-0.5">Resolution</dt>
                    <dd className="text-slate-700 bg-slate-50 rounded px-2 py-1.5">{g.resolution_note}</dd>
                  </div>
                )}
              </dl>

              {/* Action */}
              {g.status === "OPEN" && (
                <div className="pt-4 mt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => closeOne(g.id)}
                    className="btn btn-primary px-4 py-2 text-sm rounded-lg"
                  >
                    Mark resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

