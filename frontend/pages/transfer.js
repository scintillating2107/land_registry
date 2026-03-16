import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import Link from "next/link";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();
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

const STEPS = [
  "Seller Initiates Transfer",
  "Buyer Verification",
  "Registrar Approval",
  "Blockchain Transfer Completed",
];

function Icon({ d, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

// Demo metadata for display
function getDemoMeta(propertyId) {
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0; return Math.abs(h); };
  const h = hash(propertyId || "");
  const districts = ["Lucknow", "Bengaluru", "Mumbai", "Delhi"];
  const states = ["Uttar Pradesh", "Karnataka", "Maharashtra", "Delhi"];
  return { surveyNumber: `72${String.fromCharCode(65 + (h % 4))}`, district: districts[h % 4], state: states[h % 4] };
}

export default function TransferPage() {
  const router = useRouter();
  const { propertyId: queryPropertyId } = router.query;
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [property, setProperty] = useState(null);
  const [myProps, setMyProps] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [applications, setApplications] = useState([]);
  const [buyerAadhaar, setBuyerAadhaar] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerMobile, setBuyerMobile] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockchainStep, setBlockchainStep] = useState("");
  const [transferComplete, setTransferComplete] = useState(null);
  const [error, setError] = useState("");
  const [createdApplication, setCreatedApplication] = useState(null);

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);
  const propertyId = (queryPropertyId || property?.property_id || "").trim();
  const demoMeta = useMemo(() => getDemoMeta(propertyId), [propertyId]);
  const selectedProperty = myProps.find((p) => p.property_id === propertyId);
  const isOwner = selectedProperty && user?.id === selectedProperty.owner_user_id;
  const isRegistrar = user?.role === "REGISTRAR";
  const pendingApp = createdApplication || applications.find((a) => a.property_id === propertyId && ["SUBMITTED", "UNDER_REVIEW"].includes(a.status));

  useEffect(() => setUser(getUser()), []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [propsRes, usersRes, appsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/properties/my`, headers),
          axios.get(`${API_BASE}/api/users/users?role=CITIZEN`, headers),
          axios.get(`${API_BASE}/api/applications/${user.role === "REGISTRAR" ? "inbox" : "my"}`, headers),
        ]);
        setMyProps(propsRes.data.properties || []);
        setCitizens((usersRes.data.users || []).filter((u) => u.id !== user.id));
        setApplications(appsRes.data.applications || []);
        if (queryPropertyId && !property) {
          const prop = (propsRes.data.properties || []).find((p) => p.property_id === queryPropertyId);
          if (prop) setProperty(prop);
        }
      } catch {
        setError("Failed to load data");
      }
    })();
  }, [user, queryPropertyId, headers]);

  useEffect(() => {
    if (!propertyId || !property && myProps.length) {
      const p = myProps.find((x) => x.property_id === propertyId) || myProps[0];
      if (p) setProperty(p);
    }
  }, [propertyId, myProps, property]);

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!toUserId || !propertyId) {
      setError("Select a buyer (registered citizen).");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/applications/transfer`,
        { propertyId, toUserId, citizenNote: saleAmount ? `Sale amount: ${saleAmount}` : undefined },
        headers
      );
      setCreatedApplication(res.data.application);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit transfer request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyerAccept = () => {
    setStep(3);
  };

  const handleBuyerReject = () => {
    setError("Buyer rejected the transfer.");
  };

  const handleRegistrarApprove = async () => {
    if (!pendingApp) return;
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/applications/${pendingApp.id}/approve`, {}, headers);
      setStep(4);
      setBlockchainStep("Validating Ownership");
      await new Promise((r) => setTimeout(r, 600));
      setBlockchainStep("Executing Smart Contract");
      await new Promise((r) => setTimeout(r, 700));
      setBlockchainStep("Updating Land Registry");
      await new Promise((r) => setTimeout(r, 500));
      setBlockchainStep("Recording Blockchain Transaction");
      await new Promise((r) => setTimeout(r, 600));
      const auditRes = await axios.get(`${API_BASE}/api/properties/${propertyId}/audit`, headers);
      const blocks = auditRes.data?.blocks || [];
      const lastBlock = blocks[blocks.length - 1];
      setTransferComplete({
        propertyId,
        previousOwner: pendingApp.from_user_id,
        newOwner: pendingApp.to_user_id,
        txId: lastBlock?.id,
        blockNumber: lastBlock?.height,
        timestamp: lastBlock?.created_at || new Date().toISOString(),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistrarReject = async () => {
    if (!pendingApp) return;
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/applications/${pendingApp.id}/reject`, { registrarNote: "Rejected in transfer workflow" }, headers);
      setError("Transfer rejected by registrar.");
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Reject failed");
    } finally {
      setSubmitting(false);
    }
  };

  const userName = (id) => citizens.find((c) => c.id === id)?.name || user?.name || "—";

  if (!user) {
    // Layout will handle auth redirect; show loading to avoid bounce back to login.
    return (
      <Layout>
        <div className="min-h-[200px] flex items-center justify-center" style={{ backgroundColor: GOV_BG }}>
          <p className="text-gray-500">Loading transfer workflow…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6" style={{ backgroundColor: GOV_BG }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>Transfer Property Ownership</h1>
          <p className="text-sm text-gray-500 mt-1">Securely transfer land ownership through verified blockchain transactions.</p>
        </div>

        {propertyId && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium" style={{ color: GOV_TEXT }}>Selected Property</p>
            <p className="text-xs text-gray-500">Property ID: {propertyId} • Survey: {demoMeta.surveyNumber} • Location: {demoMeta.district}, {demoMeta.state}</p>
          </div>
        )}

        {/* Step progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2 justify-between">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > i + 1 ? "text-white bg-emerald-500" : step === i + 1 ? "text-white" : "text-gray-400 bg-gray-200"
                  }`}
                  style={step === i + 1 ? { backgroundColor: GOV_BLUE } : undefined}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${step >= i + 1 ? "" : "text-gray-400"}`} style={step >= i + 1 ? { color: GOV_TEXT } : {}}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
        )}

        {/* Step 1 — Seller initiates */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold" style={{ color: GOV_TEXT }}>Step 1 — Seller Initiates Transfer</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Current Owner</span><p className="font-medium" style={{ color: GOV_TEXT }}>{user.name}</p></div>
                <div><span className="text-gray-500">Property ID</span><p className="font-medium" style={{ color: GOV_TEXT }}>{propertyId || "—"}</p></div>
                <div><span className="text-gray-500">Survey Number</span><p className="font-medium" style={{ color: GOV_TEXT }}>{demoMeta.surveyNumber}</p></div>
                <div><span className="text-gray-500">Land Area</span><p className="font-medium" style={{ color: GOV_TEXT }}>—</p></div>
              </div>
              {!propertyId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={propertyId}
                    onChange={(e) => {
                      const p = myProps.find((x) => x.property_id === e.target.value);
                      if (p) setProperty(p);
                      router.replace({ query: { ...router.query, propertyId: e.target.value } }, undefined, { shallow: true });
                    }}
                  >
                    <option value="">Choose property</option>
                    {myProps.filter((p) => p.owner_user_id === user.id).map((p) => (
                      <option key={p.property_id} value={p.property_id}>{p.property_id}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer (Registered Citizen)</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={toUserId}
                    onChange={(e) => {
                      setToUserId(e.target.value);
                      const c = citizens.find((u) => u.id === e.target.value);
                      if (c) setBuyerName(c.name);
                    }}
                  >
                    <option value="">Select buyer</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Aadhaar ID</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="12-digit Aadhaar" value={buyerAadhaar} onChange={(e) => setBuyerAadhaar(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Mobile</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="10-digit mobile" value={buyerMobile} onChange={(e) => setBuyerMobile(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount (optional)</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. ₹ 15,00,000" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} />
              </div>
              {(selectedProperty?.mortgage_status === "ACTIVE" || selectedProperty?.litigation_status === "ACTIVE") && (
                <div className="py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  Property Under Mortgage or Legal Dispute – transfer may be restricted.
                </div>
              )}
              <button
                type="button"
                onClick={handleInitiate}
                disabled={submitting || !toUserId || !propertyId}
                className="px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: GOV_BLUE }}
              >
                {submitting ? "Submitting…" : "Initiate Ownership Transfer"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Buyer verification */}
        {step === 2 && pendingApp && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold" style={{ color: GOV_TEXT }}>Step 2 — Buyer Verification</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Buyer receives transfer request. Confirm property details.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Property ID</span><p style={{ color: GOV_TEXT }}>{pendingApp.property_id}</p></div>
                <div><span className="text-gray-500">Survey Number</span><p style={{ color: GOV_TEXT }}>{demoMeta.surveyNumber}</p></div>
                <div><span className="text-gray-500">Seller</span><p style={{ color: GOV_TEXT }}>{userName(pendingApp.from_user_id)}</p></div>
                <div><span className="text-gray-500">Sale Amount</span><p style={{ color: GOV_TEXT }}>{saleAmount || "—"}</p></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleBuyerAccept} className="px-6 py-2.5 rounded-lg text-white font-semibold" style={{ backgroundColor: GOV_SUCCESS }}>Accept Transfer</button>
                <button type="button" onClick={handleBuyerReject} className="px-6 py-2.5 rounded-lg border border-red-300 text-red-700 font-semibold">Reject Transfer</button>
              </div>
              <p className="text-xs text-gray-500">After acceptance: Buyer Identity Verified → proceed to Registrar.</p>
            </div>
          </div>
        )}

        {/* Step 3 — Registrar approval */}
        {step === 3 && pendingApp && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold" style={{ color: GOV_TEXT }}>Step 3 — Registrar Approval</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Registrar reviews the transfer. Document verification status: Verified (demo).</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Current Owner</span><p style={{ color: GOV_TEXT }}>{userName(pendingApp.from_user_id)}</p></div>
                <div><span className="text-gray-500">New Buyer</span><p style={{ color: GOV_TEXT }}>{userName(pendingApp.to_user_id)}</p></div>
                <div><span className="text-gray-500">Property</span><p style={{ color: GOV_TEXT }}>{pendingApp.property_id}</p></div>
              </div>
              {isRegistrar ? (
                <div className="flex gap-3">
                  <button type="button" onClick={handleRegistrarApprove} disabled={submitting} className="px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50" style={{ backgroundColor: GOV_SUCCESS }}>Approve Transfer</button>
                  <button type="button" onClick={handleRegistrarReject} disabled={submitting} className="px-6 py-2.5 rounded-lg border border-red-300 text-red-700 font-semibold">Reject Transfer</button>
                </div>
              ) : (
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setSubmitting(true);
                      setStep(4);
                      setBlockchainStep("Validating Ownership");
                      await new Promise((r) => setTimeout(r, 600));
                      setBlockchainStep("Executing Smart Contract");
                      await new Promise((r) => setTimeout(r, 700));
                      setBlockchainStep("Updating Land Registry");
                      await new Promise((r) => setTimeout(r, 500));
                      setBlockchainStep("Recording Blockchain Transaction");
                      await new Promise((r) => setTimeout(r, 600));
                      setTransferComplete({
                        propertyId: pendingApp.property_id,
                        previousOwner: pendingApp.from_user_id,
                        newOwner: pendingApp.to_user_id,
                        txId: `tx-${Date.now()}`,
                        blockNumber: Math.floor(Math.random() * 1000) + 100,
                        timestamp: new Date().toISOString(),
                      });
                      setSubmitting(false);
                    }}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50"
                    style={{ backgroundColor: GOV_SAFFRON }}
                  >
                    {submitting ? "Processing…" : "Simulate Registrar Approval (Demo)"}
                  </button>
                  <span className="text-xs text-gray-500">Log in as Registrar to perform real approval.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Blockchain + Success */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold" style={{ color: GOV_TEXT }}>Step 4 — Blockchain Transaction</h2>
            </div>
            <div className="p-6 space-y-4">
              {!transferComplete ? (
                <>
                  <p className="text-sm text-gray-600">{blockchainStep || "Processing…"}</p>
                  <div className="flex gap-2">
                    {["Validating Ownership", "Executing Smart Contract", "Updating Land Registry", "Recording Blockchain Transaction"].map((s) => (
                      <span key={s} className={`px-2 py-1 rounded text-xs ${blockchainStep === s ? "bg-blue-100 font-medium" : "bg-gray-100"}`}>{s}</span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-lg">✓</span>
                    <span className="font-semibold" style={{ color: GOV_SUCCESS }}>Ownership Transfer Successful</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Property ID</span><p style={{ color: GOV_TEXT }}>{transferComplete.propertyId}</p></div>
                    <div><span className="text-gray-500">Previous Owner</span><p style={{ color: GOV_TEXT }}>{userName(transferComplete.previousOwner)}</p></div>
                    <div><span className="text-gray-500">New Owner</span><p style={{ color: GOV_TEXT }}>{userName(transferComplete.newOwner)}</p></div>
                    <div><span className="text-gray-500">Transaction ID</span><p className="font-mono text-xs" style={{ color: GOV_TEXT }}>{transferComplete.txId}</p></div>
                    <div><span className="text-gray-500">Block Number</span><p style={{ color: GOV_TEXT }}>{transferComplete.blockNumber}</p></div>
                    <div><span className="text-gray-500">Timestamp</span><p className="text-xs" style={{ color: GOV_TEXT }}>{transferComplete.timestamp ? new Date(transferComplete.timestamp).toLocaleString() : "—"}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Link
                      href={`/property/${encodeURIComponent(transferComplete.propertyId || propertyId)}`}
                      className="px-6 py-2.5 rounded-lg text-white font-semibold"
                      style={{ backgroundColor: GOV_BLUE }}
                    >
                      View Property Details
                    </Link>
                    <Link
                      href="/dashboard"
                      className="px-6 py-2.5 rounded-lg border border-gray-300 font-semibold"
                      style={{ color: GOV_TEXT }}
                    >
                      Return to Dashboard
                    </Link>
                    <Link
                      href={`/certificate?propertyId=${encodeURIComponent(transferComplete.propertyId || propertyId)}`}
                      className="px-6 py-2.5 rounded-lg border font-semibold"
                      style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}
                    >
                      Download Updated Digital Deed
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
