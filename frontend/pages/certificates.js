import { useEffect, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();

export default function CertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/certificates/my`, {
        headers: getAuthHeaders(),
      });
      setCerts(res.data.certificates || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load certificates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openCert(id) {
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/certificates/${id}`, {
        headers: getAuthHeaders(),
      });
      setSelected(res.data.certificate);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load certificate");
    }
  }

  return (
    <Layout>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
          <p className="text-sm text-slate-600">
            Government-style certificates issued after approvals (demo).
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

      <div className="grid lg:grid-cols-12 gap-4">
        <section className="lg:col-span-5 space-y-3">
          <div className="card p-4">
            <div className="text-sm font-semibold text-slate-900">My certificates</div>
            <div className="text-xs text-slate-600 mt-1">
              Select a row to view the certificate payload.
            </div>
          </div>

          {loading && <div className="card p-4 text-sm text-slate-600">Loading…</div>}
          {!loading && certs.length === 0 && (
            <div className="card p-4 text-sm text-slate-600">
              No certificates issued yet. Approve a transfer application first.
            </div>
          )}

          {!loading &&
            certs.map((c) => (
              <button
                key={c.id}
                className="card p-4 text-left hover:border-primary transition"
                type="button"
                onClick={() => openCert(c.id)}
              >
                <div className="text-sm font-semibold text-slate-900">{c.certificate_no}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Type: {c.type} · Property: <span className="font-mono">{c.property_id}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Issued: {new Date(c.issued_at).toLocaleString()}
                </div>
              </button>
            ))}
        </section>

        <section className="lg:col-span-7">
          <div className="card p-5">
            {!selected && (
              <div className="text-sm text-slate-600">
                Select a certificate to view details.
              </div>
            )}
            {selected && (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-600 uppercase tracking-wide">
                      Certificate
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {selected.certificate_no}
                    </div>
                    <div className="text-sm text-slate-700 mt-1">
                      Property: <span className="font-mono">{selected.property_id}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    Issued at
                    <div className="font-semibold text-slate-900">
                      {new Date(selected.issued_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="text-sm font-semibold text-slate-900">Payload (demo)</div>
                  <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto">
{JSON.stringify(selected.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

