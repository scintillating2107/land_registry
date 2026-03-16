import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Layout } from "@/components/Layout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const GOV_BLUE = "#1A73E8";
const GOV_SAFFRON = "#FF9933";
const GOV_BG = "#F5F7FA";
const GOV_TEXT = "#2C2C2C";
const GOV_SUCCESS = "#2E7D32";
const GOV_WARNING = "#F9A825";

function getUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("bhoomi_user");
  return stored ? JSON.parse(stored) : null;
}

function Icon({ d, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function buildOwnershipTimeline(blocks, ownerName) {
  const out = [];
  const register = blocks.find((b) => b.tx_type === "LAND_REGISTER");
  if (register) {
    out.push({
      year: new Date(register.created_at).getFullYear(),
      label: "Land Registered",
      owner: ownerName,
      txType: register.tx_type,
      date: register.created_at,
      id: register.id,
    });
  }
  blocks.filter((b) => b.tx_type === "TRANSFER").forEach((b, i) => {
    out.push({
      year: new Date(b.created_at).getFullYear(),
      label: "Ownership Transfer",
      owner: i === blocks.filter((x) => x.tx_type === "TRANSFER").length - 1 ? ownerName : "Previous Owner",
      txType: b.tx_type,
      date: b.created_at,
      id: b.id,
    });
  });
  if (out.length === 0 && ownerName) {
    out.push({
      year: new Date().getFullYear(),
      label: "Current Owner",
      owner: ownerName,
      txType: null,
      date: null,
      id: null,
    });
  }
  return out;
}

export default function VerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [propertyIdInput, setPropertyIdInput] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [qrOrUrl, setQrOrUrl] = useState("");

  const [result, setResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const txId = router.query.tx;
    if (typeof txId !== "string" || !txId.trim()) return;
    setLoading(true);
    setError("");
    axios
      .get(`${API_BASE}/api/public/tx/${encodeURIComponent(txId.trim())}`)
      .then((res) => setResult({ mode: "tx", data: res.data }))
      .catch(() => setError("Transaction not found"))
      .finally(() => setLoading(false));
  }, [router.query.tx]);

  useEffect(() => {
    const pid = router.query.propertyId;
    if (typeof pid !== "string" || !pid.trim()) return;
    // Auto-run property verification when coming from QR with propertyId
    verifyByPropertyId(null, pid.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.propertyId]);

  async function verifyByPropertyId(e, overrideId) {
    e?.preventDefault();
    const id = (overrideId != null ? overrideId : propertyIdInput).toString().trim();
    if (!id) {
      setError("Enter a Property ID");
      return;
    }
    if (overrideId) setPropertyIdInput(id);
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/public/property/${encodeURIComponent(id)}`);
      setResult({ mode: "property", data: res.data });
    } catch (err) {
      setError(err.response?.data?.message || "Property not found");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function searchBySurveyDistrictState(e) {
    e?.preventDefault();
    setError("");
    setLoadingSearch(true);
    try {
      const q = [surveyNumber, district, stateInput].filter(Boolean).join(" ").trim() || "property";
      const res = await axios.get(`${API_BASE}/api/public/properties/search`, {
        params: { q: q || undefined, limit: 12 },
      });
      const list = res.data.properties || [];
      setSearchResults(list);
      if (list.length === 1) {
        setResult({ mode: "property", data: await axios.get(`${API_BASE}/api/public/property/${encodeURIComponent(list[0].property_id)}`).then((r) => r.data) });
      } else if (list.length > 1) {
        setResult(null);
      } else {
        setResult(null);
        setError("No property found for the given Survey / District / State.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
      setSearchResults([]);
      setResult(null);
    } finally {
      setLoadingSearch(false);
    }
  }

  async function verifyByQrOrUrl(e) {
    e?.preventDefault();
    const raw = qrOrUrl.trim();
    if (!raw) {
      setError("Paste a verification URL or Property ID from the QR code.");
      return;
    }
    setError("");
    let id = raw;
    try {
      const url = new URL(raw);
      const path = url.pathname;
      const match = path.match(/\/property\/([^/]+)/) || path.match(/\/tx\/([^/]+)/);
      if (match) id = decodeURIComponent(match[1]);
    } catch {
      id = raw;
    }
    setPropertyIdInput(id);
    setLoading(true);
    try {
      const propRes = await axios.get(`${API_BASE}/api/public/property/${encodeURIComponent(id)}`);
      setResult({ mode: "property", data: propRes.data });
    } catch (err1) {
      try {
        const txRes = await axios.get(`${API_BASE}/api/public/tx/${encodeURIComponent(id)}`);
        setResult({ mode: "tx", data: txRes.data });
      } catch (err2) {
        setError("Verification URL or ID did not match a property or transaction.");
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const prop = result?.mode === "property" ? result.data.property : null;
  const blocks = result?.mode === "property" ? result.data.blocks || [] : [];
  const fraudAnalysis = result?.mode === "property" ? result.data.fraudAnalysis : null;
  const mortgageStatus = result?.mode === "property" ? result.data.mortgageStatus : null;
  const litigationStatus = result?.mode === "property" ? result.data.litigationStatus : null;
  const ownerName = prop?.owner?.name || "—";
  const ownershipTimeline = useMemo(
    () => (prop ? buildOwnershipTimeline(blocks, ownerName) : []),
    [prop, blocks, ownerName]
  );
  const latestBlock = blocks.length ? blocks[blocks.length - 1] : null;
  const underMortgage = mortgageStatus === "ACTIVE";
  const underDispute = litigationStatus === "ACTIVE";
  const riskLevel = fraudAnalysis?.level || "LOW";

  const mainContent = (
    <div className="p-6 space-y-6" style={{ backgroundColor: GOV_BG }}>
      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>Verify Land Ownership</h1>
        <p className="text-sm text-gray-500 mt-1">
          Check the authenticity of land ownership records on the BhoomiChain blockchain before purchasing property.
        </p>
      </div>

      {/* Verification input panel — 3 methods */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold" style={{ color: GOV_TEXT }}>Verification Methods</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Method 1 — Property ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method 1 – Property ID</label>
              <form onSubmit={verifyByPropertyId} className="space-y-2">
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  placeholder="BC-LAND-002451"
                  value={propertyIdInput}
                  onChange={(e) => setPropertyIdInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-70"
                  style={{ backgroundColor: GOV_BLUE }}
                >
                  {loading ? "Verifying…" : "Verify Property"}
                </button>
              </form>
            </div>

            {/* Method 2 — Survey / District / State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method 2 – Survey Number Search</label>
              <form onSubmit={searchBySurveyDistrictState} className="space-y-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  placeholder="Survey Number"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  disabled={loadingSearch}
                />
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  placeholder="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={loadingSearch}
                />
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  placeholder="State"
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  disabled={loadingSearch}
                />
                <button
                  type="submit"
                  disabled={loadingSearch}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-70"
                  style={{ backgroundColor: GOV_BLUE }}
                >
                  {loadingSearch ? "Searching…" : "Search Property"}
                </button>
              </form>
            </div>

            {/* Method 3 — QR / URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method 3 – QR Code Verification</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center bg-gray-50 mb-2">
                <span className="text-xs text-gray-500">QR Code Scanner</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Scan property QR code to verify blockchain ownership.</p>
              <form onSubmit={verifyByQrOrUrl} className="space-y-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  placeholder="Or paste verification URL or Property ID"
                  value={qrOrUrl}
                  onChange={(e) => setQrOrUrl(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-lg border font-medium text-sm disabled:opacity-70"
                  style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}
                >
                  Verify from URL
                </button>
              </form>
            </div>
          </div>

          {searchResults.length > 1 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Select a property from search results:</p>
              <div className="flex flex-wrap gap-2">
                {searchResults.map((p) => (
                  <button
                    key={p.property_id}
                    type="button"
                    onClick={() => verifyByPropertyId(null, p.property_id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono hover:bg-gray-50"
                    style={{ color: GOV_TEXT }}
                  >
                    {p.property_id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{error}</div>
          )}
        </div>
      </div>

      {/* Results */}
      {result?.mode === "property" && prop && (
        <>
          {/* Property summary + verification badge */}
          <SectionCard
            title="Verification Result"
            icon={<Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm" style={{ borderColor: GOV_SUCCESS, color: GOV_SUCCESS, backgroundColor: "#E8F5E9" }}>
                ✓ Verified on BhoomiChain Blockchain
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500 block">Property ID</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.property_id}</p></div>
              <div><span className="text-gray-500 block">Survey Number</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.survey_number || "—"}</p></div>
              <div><span className="text-gray-500 block">Owner Name</span><p className="font-medium" style={{ color: GOV_TEXT }}>{ownerName}</p></div>
              <div><span className="text-gray-500 block">District</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.district || "—"}</p></div>
              <div><span className="text-gray-500 block">State</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.state || "—"}</p></div>
              <div><span className="text-gray-500 block">Land Area</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.land_area_sq_m != null ? `${prop.land_area_sq_m} sq m` : "—"}</p></div>
              <div><span className="text-gray-500 block">Land Type</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.land_type || "—"}</p></div>
            </div>
          </SectionCard>

          {/* Warnings */}
          {(underMortgage || underDispute) && (
            <div className="space-y-2">
              {underMortgage && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-medium">
                  Property under active mortgage – transfer restricted.
                </div>
              )}
              {underDispute && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm font-medium">
                  Legal dispute registered – transfer frozen.
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Ownership history preview */}
              <SectionCard
                title="Ownership History"
                icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              >
                <ul className="space-y-3">
                  {ownershipTimeline.slice(-5).map((item, i) => (
                    <li key={item.id || i} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: GOV_BLUE }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: GOV_TEXT }}>{item.year} — {item.label}</p>
                        <p className="text-xs text-gray-500">Owner: {item.owner}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {user && (
                  <Link href={`/property/${encodeURIComponent(prop.property_id)}`} className="mt-3 inline-block text-sm font-medium" style={{ color: GOV_BLUE }}>View Full Ownership History</Link>
                )}
                {!user && <p className="mt-3 text-xs text-gray-500">Log in to view full ownership history on the property page.</p>}
              </SectionCard>

              {/* Land status panel */}
              <SectionCard
                title="Land Status"
                icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              >
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Ownership Verified</span>
                  {underMortgage ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">Mortgage Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">No Mortgage</span>
                  )}
                  {underDispute ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-800">Dispute Under Court</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">No Dispute</span>
                  )}
                </div>
              </SectionCard>

              {/* Blockchain verification */}
              <SectionCard
                title="Blockchain Verification"
                icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Blockchain Network</span><span style={{ color: GOV_TEXT }}>BhoomiChain (Hyperledger Fabric)</span></div>
                  {latestBlock && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500">Transaction Hash</span><span className="font-mono text-xs truncate max-w-[140px]" style={{ color: GOV_TEXT }}>{latestBlock.hash?.slice(0, 16)}…</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Block Number</span><span style={{ color: GOV_TEXT }}>{latestBlock.height ?? "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Transaction Timestamp</span><span className="text-xs" style={{ color: GOV_TEXT }}>{latestBlock.created_at ? new Date(latestBlock.created_at).toLocaleString() : "—"}</span></div>
                    </>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Record Verified</span>
                  <Link href={`${API_BASE}/api/public/tx/${latestBlock?.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: GOV_BLUE }}>View Blockchain Transaction</Link>
                </div>
              </SectionCard>

              {/* Fraud risk indicator */}
              <SectionCard
                title="Fraud Risk Indicator"
                icon={<Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
              >
                <div className={`rounded-lg border px-4 py-3 text-sm ${
                  riskLevel === "HIGH" ? "border-red-200 bg-red-50 text-red-900" :
                  riskLevel === "MEDIUM" ? "border-amber-200 bg-amber-50 text-amber-900" :
                  "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}>
                  <div className="font-semibold">Risk level: {riskLevel}</div>
                  {(fraudAnalysis?.alerts || []).length > 0 ? (
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {fraudAnalysis.alerts.map((a) => (
                        <li key={a.code}>{a.title}: {a.detail}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1">No active fraud signals detected for this property.</p>
                  )}
                  {underMortgage && <p className="mt-1">• Property under active mortgage</p>}
                  {underDispute && <p className="mt-1">• Legal dispute registered</p>}
                </div>
              </SectionCard>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Document verification */}
              <SectionCard
                title="Document Verification"
                icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              >
                <ul className="space-y-3">
                  {["Land Title Certificate", "Sale Deed", "Survey Map"].map((name, i) => (
                    <li key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div>
                        <p className="text-sm font-medium" style={{ color: GOV_TEXT }}>{name}</p>
                        <p className="text-xs text-gray-500">Verified • IPFS stored</p>
                      </div>
                      <button type="button" className="text-xs font-medium" style={{ color: GOV_BLUE }}>View Document</button>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              {/* Property location map */}
              <SectionCard
                title="Property Location"
                icon={<Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
              >
                <div className="h-56 rounded-lg overflow-hidden bg-gray-100">
                  <MapView
                    coordinates={prop.geo_coordinates}
                    propertyId={prop.property_id}
                    ownerName={ownerName}
                    landArea={prop.land_area_sq_m != null ? `${prop.land_area_sq_m} sq m` : undefined}
                    statusLabel={underMortgage ? "Under Mortgage" : underDispute ? "Dispute" : "Clear"}
                    verified
                    boundaryGeojson={prop.boundary_geojson || null}
                  />
                </div>
                <p className="mt-2 text-xs font-mono text-gray-500">Coordinates: {prop.geo_coordinates || "—"}</p>
              </SectionCard>

              {/* Public action buttons */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-medium" style={{ color: GOV_TEXT }}>Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: GOV_BLUE }}>Download Verification Report</button>
                  <Link href={latestBlock?.id ? `/verify?tx=${encodeURIComponent(latestBlock.id)}` : "#"} className="px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}>View Blockchain Record</Link>
                  <a href="mailto:registrar@bhoomichain.gov.in" className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700">Contact Registrar</a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {result?.mode === "tx" && (
        <SectionCard
          title="Transaction Verification"
          icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Record Verified</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Transaction ID</span><p className="font-mono text-xs" style={{ color: GOV_TEXT }}>{result.data.block.id}</p></div>
            <div><span className="text-gray-500">Type</span><p style={{ color: GOV_TEXT }}>{result.data.block.tx_type}</p></div>
            <div><span className="text-gray-500">Property</span><p style={{ color: GOV_TEXT }}>{result.data.block.property_id || "—"}</p></div>
            <div><span className="text-gray-500">Timestamp</span><p className="text-xs" style={{ color: GOV_TEXT }}>{result.data.block.created_at ? new Date(result.data.block.created_at).toLocaleString() : "—"}</p></div>
          </div>
        </SectionCard>
      )}

      {!result && !loading && !loadingSearch && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 text-sm">
          Use one of the verification methods above to check land ownership records.
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        <Link href="/" className="font-medium hover:underline" style={{ color: GOV_BLUE }}>Back to Home</Link>
      </div>
    </div>
  );

  const isLoggedIn = !!user;

  if (isLoggedIn) {
    return <Layout>{mainContent}</Layout>;
  }

  return (
    <PublicShell
      title="Verify Land Ownership"
      subtitle="Check the authenticity of land ownership records on the BhoomiChain blockchain before purchasing property."
    >
      <div className="max-w-5xl mx-auto">
        {mainContent}
      </div>
    </PublicShell>
  );
}
