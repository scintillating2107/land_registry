import { useMemo, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

export default function VerifyPage() {
  const [propertyId, setPropertyId] = useState("");
  const [txId, setTxId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupByProperty(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const pid = propertyId.trim();
      const res = await axios.get(`${API_BASE}/api/public/property/${pid}`);
      setResult({ mode: "property", data: res.data });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function lookupByTx(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = txId.trim();
      const res = await axios.get(`${API_BASE}/api/public/tx/${id}`);
      setResult({ mode: "tx", data: res.data });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  const qrValue = useMemo(() => {
    if (!result) return "";
    if (result.mode === "property") {
      return `${API_BASE}/api/public/property/${result.data.property.property_id}`;
    }
    if (result.mode === "tx") {
      return `${API_BASE}/api/public/tx/${result.data.block.id}`;
    }
    return "";
  }, [result]);

  return (
    <PublicShell
      title="Public Land Record Verification"
      subtitle="Verify land ownership, mortgage and litigation status using an immutable audit trail."
    >
      <div className="grid lg:grid-cols-3 gap-4">
        <section className="lg:col-span-1 card p-4 space-y-4">
            <div>
              <h2 className="font-semibold mb-2 text-sm text-slate-900">
                Verify by Property ID
              </h2>
              <form onSubmit={lookupByProperty} className="space-y-2">
                <input
                  className="input text-sm"
                  placeholder="e.g. PROP-12345"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="w-full btn btn-primary px-3 py-2 rounded-lg text-xs"
                  disabled={loading || !propertyId.trim()}
                >
                  {loading ? "Verifying…" : "Verify Property"}
                </button>
              </form>
            </div>

            <div>
              <h2 className="font-semibold mb-2 text-sm text-slate-900">
                Verify by Transaction ID
              </h2>
              <form onSubmit={lookupByTx} className="space-y-2">
                <input
                  className="input text-sm"
                  placeholder="Paste blockchain Tx ID"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="w-full btn btn-secondary px-3 py-2 rounded-lg text-xs"
                  disabled={loading || !txId.trim()}
                >
                  {loading ? "Verifying…" : "Verify Transaction"}
                </button>
              </form>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {!result && (
              <div className="text-xs text-slate-600 border border-dashed border-slate-300 rounded-lg px-3 py-2">
                Tip: Ask the registrar for a Property ID (for example{" "}
                <span className="font-mono">PROP-12345</span>) or paste a transaction/block ID from
                the audit timeline.
              </div>
            )}

            {qrValue && (
              <div className="mt-4">
                <div className="text-xs text-slate-600 mb-1">
                  QR for this verification
                </div>
                <div className="bg-white p-2 inline-block rounded border border-slate-200">
                  <QRCode value={qrValue} size={120} />
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Scan to re-verify this record directly against the API.
                </div>
              </div>
            )}
        </section>

        <section className="lg:col-span-2 space-y-4">
            {result && result.mode === "property" && (
              <div className="card p-4 text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">
                      Verification Certificate · Property {result.data.property.property_id}
                    </div>
                    <div className="text-xs text-slate-500">
                      Last verified: {new Date().toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-right">
                    <div
                      className={`px-2 py-1 rounded-full border ${
                        result.data.chainValid
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {result.data.chainValid ? "Chain integrity: VALID" : "Chain integrity: TAMPERED"}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Source: BhoomiChain simulated blockchain
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold">Mortgage:</span> {result.data.mortgageStatus}
                    </div>
                    <div>
                      <span className="font-semibold">Litigation:</span> {result.data.litigationStatus}
                    </div>
                    <div>
                      <span className="font-semibold">Risk score:</span>{" "}
                      {result.data.property.risk_score ?? 0}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold">Geo coordinates:</span>{" "}
                      <span className="font-mono">
                        {result.data.property.geo_coordinates || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">IPFS hash:</span>{" "}
                      <span className="font-mono break-all">
                        {result.data.property.ipfs_hash || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <MapView coordinates={result.data.property.geo_coordinates} />
                </div>

                <div>
                  <div className="font-semibold mb-1">Blockchain Audit Trail</div>
                  <ol className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                    {result.data.blocks.map((b) => (
                      <li
                        key={b.id}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <div className="flex justify-between">
                          <span className="text-[11px] font-mono">{b.tx_type}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(b.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 break-all">
                          Hash: {b.hash.slice(0, 24)}...
                        </div>
                        <div className="text-[10px] text-slate-600">Tx ID: {b.id}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {result && result.mode === "tx" && (
              <div className="card p-4 text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">Transaction {result.data.block.id}</div>
                    <div className="text-xs text-slate-500">
                      Type: {result.data.block.tx_type} · Property:{" "}
                      {result.data.block.property_id || "-"}
                    </div>
                  </div>
                  <div className="text-xs text-right">
                    <div
                      className={`px-2 py-1 rounded-full border ${
                        result.data.chainValid
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {result.data.chainValid ? "Chain integrity: VALID" : "Chain integrity: TAMPERED"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-600">
                  Created at: {new Date(result.data.block.created_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 break-all">
                  Hash: <span className="font-mono">{result.data.block.hash}</span>
                </div>
                <div className="text-xs text-slate-600 break-all">
                  Prev hash: <span className="font-mono">{result.data.block.prev_hash || "-"}</span>
                </div>
              </div>
            )}

            {!result && (
              <div className="card border-dashed p-4 text-sm text-slate-600">
                Enter a Property ID or Transaction ID to view immutable blockchain-backed proof of
                ownership, mortgage / litigation status, and full audit trail.
              </div>
            )}
        </section>
      </div>

      <div className="mt-6 text-xs text-slate-600">
        Back to{" "}
        <Link href="/" className="gov-link px-2 py-1 rounded">
          Home
        </Link>
      </div>
    </PublicShell>
  );
}

