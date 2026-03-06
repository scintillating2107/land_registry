import { useEffect, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();

export default function GrievancesAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    load("OPEN");
  }, []);

  async function closeOne(id) {
    setError("");
    try {
      await axios.post(
        `${API_BASE}/api/grievances/${id}/close`,
        { resolutionNote: "Resolved in demo." },
        { headers: getAuthHeaders() }
      );
      await load("OPEN");
    } catch (e) {
      setError(e.response?.data?.message || "Could not close grievance");
    }
  }

  return (
    <Layout>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grievances (admin)</h1>
          <p className="text-sm text-slate-600">
            For registrar use. View and close grievance tickets submitted from the public portal.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
            type="button"
            onClick={() => load("OPEN")}
          >
            Open
          </button>
          <button
            className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
            type="button"
            onClick={() => load("CLOSED")}
          >
            Closed
          </button>
          <button
            className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
            type="button"
            onClick={() => load("ALL")}
          >
            All
          </button>
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
        <div className="space-y-2">
          {items.map((g) => (
            <div key={g.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Grievance</div>
                  <div className="text-sm font-semibold text-slate-900">{g.grievance_no}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {g.name} &lt;{g.email}&gt;
                  </div>
                  <div className="text-sm text-slate-800 mt-2">
                    <span className="font-semibold">Subject:</span> {g.subject}
                  </div>
                  <div className="text-sm text-slate-700 mt-1">
                    <span className="font-semibold">Message:</span> {g.message}
                  </div>
                  {g.resolution_note && (
                    <div className="text-sm text-slate-700 mt-1">
                      <span className="font-semibold">Resolution:</span> {g.resolution_note}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-2">
                    Status: {g.status} · Created: {new Date(g.created_at).toLocaleString()}
                  </div>
                </div>
                {g.status === "OPEN" && (
                  <button
                    className="btn btn-primary px-3 py-2 rounded-lg text-xs"
                    type="button"
                    onClick={() => closeOne(g.id)}
                  >
                    Mark closed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

