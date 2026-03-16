import { useEffect, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();

function SmallCard({ title, children }) {
  return (
    <div className="card p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function MetricCard({ title, value, hint }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-600">{hint}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/reports/kpis`, {
        headers: getAuthHeaders(),
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Government Dashboard</h1>
          <p className="text-sm text-slate-600">
            Operational oversight for transactions, fraud alerts, disputes, and land-state risk.
          </p>
        </div>
        <button className="btn btn-secondary px-3 py-2 rounded-lg text-xs" onClick={load} type="button">
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading && <div className="card p-4 text-sm text-slate-600">Loading…</div>}

      {!loading && data && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-3">
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Oversight goal</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Spot risky properties and abnormal transaction patterns early.
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Best judge view</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Show fraud alerts, land-state blocks, and transaction volume together.
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Why it matters</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Authorities can act before fake transfers become registered ownership changes.
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard title="Registered users" value={data.users} hint="Citizen + registrar + bank + court accounts" />
            <MetricCard title="Land parcels" value={data.properties} hint="Total tokenized registry parcels" />
            <MetricCard title="Transactions" value={data.totalTransactions} hint="Executed ownership transfers on record" />
            <MetricCard title="Fraud alerts" value={data.fraudAlerts} hint="High-risk or disputed parcels needing review" />
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <SmallCard title="Government land state">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Mortgaged parcels</span>
                  <span className="font-semibold text-slate-900">{data.propertyState?.mortgaged ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Under litigation</span>
                  <span className="font-semibold text-slate-900">{data.propertyState?.litigated ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disputed</span>
                  <span className="font-semibold text-slate-900">{data.propertyState?.disputed ?? 0}</span>
                </div>
              </div>
            </SmallCard>
            <SmallCard title="Applications by status">
              <div className="space-y-1">
                {(data.applicationsByStatus || []).map((r) => (
                  <div key={r.status} className="flex justify-between">
                    <span className="text-slate-700">{r.status}</span>
                    <span className="font-semibold text-slate-900">{r.cnt}</span>
                  </div>
                ))}
              </div>
            </SmallCard>
            <SmallCard title="Disputes / grievances">
              <div className="space-y-1">
                {(data.grievancesByStatus || []).map((r) => (
                  <div key={r.status} className="flex justify-between">
                    <span className="text-slate-700">{r.status}</span>
                    <span className="font-semibold text-slate-900">{r.cnt}</span>
                  </div>
                ))}
              </div>
            </SmallCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <SmallCard title="Flagged properties">
              <div className="space-y-2">
                {(data.flaggedProperties || []).length === 0 && <div>No critical fraud alerts right now.</div>}
                {(data.flaggedProperties || []).map((item) => (
                  <div key={item.property_id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-slate-900">{item.property_id}</span>
                      <span className="text-xs font-semibold text-red-700">Risk {item.risk_score}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Mortgage {item.mortgage_status} · Litigation {item.litigation_status} · Disputed{" "}
                      {item.disputed ? "Yes" : "No"}
                    </div>
                  </div>
                ))}
              </div>
            </SmallCard>

            <SmallCard title="Ownership concentration">
              <div className="space-y-2">
                {(data.ownershipSpread || []).length === 0 && <div>No ownership data yet.</div>}
                {(data.ownershipSpread || []).map((item, idx) => (
                  <div key={`${item.owner_user_id}-${idx}`} className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="font-mono text-xs text-slate-700">{item.owner_user_id}</span>
                    <span className="font-semibold text-slate-900">{item.cnt} parcels</span>
                  </div>
                ))}
              </div>
            </SmallCard>
          </div>

          <div className="card p-4 text-sm text-slate-700">
            This government dashboard highlights transaction flow, fraud alerts, disputes, and ownership
            spread so authorities can spot abnormal activity early and scale the registry system across
            districts.
          </div>
        </div>
      )}
    </Layout>
  );
}

