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
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-600">Operational KPIs for registrar oversight (demo).</p>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <SmallCard title="Users">
            <div className="text-2xl font-bold text-slate-900">{data.users}</div>
          </SmallCard>
          <SmallCard title="Registered properties">
            <div className="text-2xl font-bold text-slate-900">{data.properties}</div>
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
          <SmallCard title="Grievances by status">
            <div className="space-y-1">
              {(data.grievancesByStatus || []).map((r) => (
                <div key={r.status} className="flex justify-between">
                  <span className="text-slate-700">{r.status}</span>
                  <span className="font-semibold text-slate-900">{r.cnt}</span>
                </div>
              ))}
            </div>
          </SmallCard>
          <SmallCard title="Notes">
            KPIs are calculated from the demo database. Extend with date filters, exports, and SLA metrics for a production system.
          </SmallCard>
        </div>
      )}
    </Layout>
  );
}

