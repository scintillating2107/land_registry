import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import dynamic from "next/dynamic";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();
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

function Icon({ d, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

// no demo metadata – use real property fields

export default function MortgagePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [propertyIdInput, setPropertyIdInput] = useState("");
  const [ownerAadhaarInput, setOwnerAadhaarInput] = useState("");
  const [audit, setAudit] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockSubmitting, setLockSubmitting] = useState(false);
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const [lockSuccess, setLockSuccess] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);

  const [bankName, setBankName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanStartDate, setLoanStartDate] = useState("");
  const [loanDuration, setLoanDuration] = useState("");
  const [lastLockBlock, setLastLockBlock] = useState(null);

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);

  useEffect(() => setUser(getUser()), []);

  const queryPropertyId = typeof router.query.propertyId === "string" ? router.query.propertyId.trim() : "";
  useEffect(() => {
    if (queryPropertyId) setPropertyIdInput(queryPropertyId);
  }, [queryPropertyId]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "BANK") {
      router.replace("/dashboard");
      return;
    }
    setBankName(user.name || "Bank Officer");
    axios.get(`${API_BASE}/api/users/users`, headers).then((r) => setUsers(r.data.users || [])).catch(() => {});
  }, [user, router, headers]);

  async function searchProperty(e) {
    e?.preventDefault();
    const id = propertyIdInput.trim();
    if (!id) {
      setError("Enter a Property ID");
      return;
    }
    const aadhaar = ownerAadhaarInput.replace(/\D/g, "");
    if (aadhaar && aadhaar.length !== 12) {
      setError("Owner Aadhaar ID must be 12 digits");
      return;
    }
    setError("");
    setLoading(true);
    setLockSuccess(false);
    setReleaseSuccess(false);
    setLastLockBlock(null);
    try {
      const res = await axios.get(`${API_BASE}/api/properties/${encodeURIComponent(id)}/audit`, headers);
      setAudit(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Property not found");
      setAudit(null);
    } finally {
      setLoading(false);
    }
  }

  async function applyMortgageLock(e) {
    e?.preventDefault();
    const prop = audit?.property;
    if (!prop) return;
    if (prop.mortgage_status === "ACTIVE") {
      setError("Mortgage already active on this property.");
      return;
    }
    setError("");
    setLockSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/api/properties/${encodeURIComponent(prop.property_id)}/mortgage/lock`,
        {},
        headers
      );
      const auditRes = await axios.get(`${API_BASE}/api/properties/${encodeURIComponent(prop.property_id)}/audit`, headers);
      const blocks = auditRes.data.blocks || [];
      const lockBlock = blocks.filter((b) => b.tx_type === "MORTGAGE_LOCK").pop() || blocks[blocks.length - 1];
      setLastLockBlock(lockBlock || null);
      setAudit(auditRes.data);
      setLockSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply mortgage lock");
    } finally {
      setLockSubmitting(false);
    }
  }

  async function releaseMortgageLock() {
    const prop = audit?.property;
    if (!prop) return;
    setError("");
    setReleaseSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/properties/${encodeURIComponent(prop.property_id)}/mortgage/release`,
        {},
        headers
      );
      const auditRes = await axios.get(`${API_BASE}/api/properties/${encodeURIComponent(prop.property_id)}/audit`, headers);
      setAudit(auditRes.data);
      setReleaseModalOpen(false);
      setReleaseSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to release mortgage lock");
    } finally {
      setReleaseSubmitting(false);
    }
  }

  const prop = audit?.property;
  const blocks = audit?.blocks || [];
  const mortgages = audit?.mortgages || [];
  const userName = (id) => users.find((u) => u.id === id)?.name || "—";
  const ownerName = prop ? userName(prop.owner_user_id) : "—";
  const activeMortgage = mortgages.find((m) => m.status === "ACTIVE");
  const underMortgage = prop?.mortgage_status === "ACTIVE";
  const latestBlock = blocks.length ? blocks[blocks.length - 1] : null;
  const displayBlock = lastLockBlock || latestBlock;

  const mortgageHistoryItems = useMemo(() => {
    const items = [];
    mortgages.forEach((m) => {
      items.push({
        year: new Date(m.created_at).getFullYear(),
        label: "Mortgage Applied",
        bankUserId: m.bank_user_id,
        released: false,
      });
      if (m.released_at) {
        items.push({
          year: new Date(m.released_at).getFullYear(),
          label: "Mortgage Released",
          detail: "Loan Cleared",
          released: true,
        });
      }
    });
    return items.sort((a, b) => a.year - b.year);
  }, [mortgages, users]);

  if (!user) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }
  if (user.role !== "BANK") return null;

  return (
    <Layout>
      <div className="p-6 space-y-6" style={{ backgroundColor: GOV_BG }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>Mortgage Lock Management</h1>
          <p className="text-sm text-gray-500 mt-1">Verify property ownership and apply mortgage locks to secure loan collateral.</p>
        </div>

        {/* Property Search Panel */}
        <SectionCard
          title="Property Search"
          icon={<Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
        >
          <form onSubmit={searchProperty} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                placeholder="e.g. BC-LAND-002451"
                value={propertyIdInput}
                onChange={(e) => setPropertyIdInput(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Aadhaar ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                placeholder="12-digit Aadhaar (optional)"
                value={ownerAadhaarInput}
                onChange={(e) => setOwnerAadhaarInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                disabled={loading}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-70"
                style={{ backgroundColor: GOV_BLUE }}
              >
                {loading ? "Searching…" : "Search Property"}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Scan Property QR Code
              </button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </SectionCard>

        {prop && (
          <>
            {lockSuccess && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm font-medium">
                Mortgage Lock Successfully Applied
              </div>
            )}
            {underMortgage && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-medium">
                Property Under Mortgage – Ownership Transfer Restricted
              </div>
            )}

            {/* Mortgage Lock Confirmation — when mortgage is active */}
            {underMortgage && activeMortgage && (
              <SectionCard
                title="Mortgage Lock Confirmation"
                icon={<Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">Mortgage Lock Active</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-gray-500 block">Property ID</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.property_id}</p></div>
                  <div><span className="text-gray-500 block">Bank Name</span><p className="font-medium" style={{ color: GOV_TEXT }}>{userName(activeMortgage.bank_user_id)}</p></div>
                  <div><span className="text-gray-500 block">Loan Amount</span><p className="font-medium" style={{ color: GOV_TEXT }}>{loanAmount || "—"}</p></div>
                  <div><span className="text-gray-500 block">Mortgage Status</span><p className="font-medium text-amber-700">Active</p></div>
                </div>
              </SectionCard>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Property Details Panel */}
                <SectionCard
                  title="Property Details"
                  icon={<Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Ownership Verified on Blockchain</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Property ID</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.property_id}</p></div>
                    <div><span className="text-gray-500">Survey Number</span><p className="font-medium" style={{ color: GOV_TEXT }}>{demoMeta.surveyNumber}</p></div>
                    <div><span className="text-gray-500">Owner Name</span><p className="font-medium" style={{ color: GOV_TEXT }}>{ownerName}</p></div>
                    <div><span className="text-gray-500">District</span><p className="font-medium" style={{ color: GOV_TEXT }}>{demoMeta.district}</p></div>
                    <div><span className="text-gray-500">Land Area</span><p className="font-medium" style={{ color: GOV_TEXT }}>{demoMeta.landArea}</p></div>
                    <div><span className="text-gray-500">Land Type</span><p className="font-medium" style={{ color: GOV_TEXT }}>{demoMeta.landType}</p></div>
                  </div>
                </SectionCard>

                {/* Blockchain Ownership Verification */}
                <SectionCard
                  title="Blockchain Ownership Verification"
                  icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}
                >
                  {displayBlock ? (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Transaction Hash</span><span className="font-mono text-xs truncate max-w-[160px]" style={{ color: GOV_TEXT }}>{displayBlock.hash?.slice(0, 18)}…</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Block Number</span><span style={{ color: GOV_TEXT }}>{displayBlock.height ?? "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Transaction Timestamp</span><span className="text-xs" style={{ color: GOV_TEXT }}>{displayBlock.created_at ? new Date(displayBlock.created_at).toLocaleString() : "—"}</span></div>
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Verified Blockchain Ownership</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No blockchain record to display.</p>
                  )}
                </SectionCard>

                {/* Mortgage Status Panel */}
                <SectionCard
                  title="Mortgage Status"
                  icon={<Icon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                >
                  {underMortgage && activeMortgage ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Mortgage Status</span><span className="font-medium text-amber-700">Active</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Bank Name</span><span style={{ color: GOV_TEXT }}>{userName(activeMortgage.bank_user_id)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Loan Amount</span><span style={{ color: GOV_TEXT }}>{loanAmount || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Loan Start Date</span><span style={{ color: GOV_TEXT }}>{loanStartDate || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Loan Expiry Date</span><span style={{ color: GOV_TEXT }}>{loanDuration ? (() => { const d = new Date(loanStartDate); d.setMonth(d.getMonth() + parseInt(loanDuration, 10) || 0); return d.toLocaleDateString(); })() : "—"}</span></div>
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => setReleaseModalOpen(true)}
                          disabled={releaseSubmitting}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-70"
                        >
                          {releaseSubmitting ? "Releasing…" : "Release Mortgage Lock"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No Active Mortgage</p>
                  )}
                </SectionCard>

                {/* Apply Mortgage Lock */}
                {!underMortgage && (
                  <SectionCard
                    title="Apply Mortgage Lock"
                    icon={<Icon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                  >
                    <form onSubmit={applyMortgageLock} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. ₹ 15,00,000" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Start Date</label>
                          <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={loanStartDate} onChange={(e) => setLoanStartDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Duration (months)</label>
                          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 60" value={loanDuration} onChange={(e) => setLoanDuration(e.target.value)} min="1" />
                        </div>
                        <button
                          type="submit"
                          disabled={lockSubmitting}
                          className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-70"
                          style={{ backgroundColor: GOV_BLUE }}
                        >
                          {lockSubmitting ? "Applying…" : "Apply Mortgage Lock"}
                        </button>
                      </form>
                  </SectionCard>
                )}

                {/* Blockchain Transaction Panel (after lock) */}
                {lastLockBlock && (
                  <SectionCard
                    title="Blockchain Transaction"
                    icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Transaction Hash</span><span className="font-mono text-xs truncate max-w-[140px]" style={{ color: GOV_TEXT }}>{lastLockBlock.hash?.slice(0, 16)}…</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Block Number</span><span style={{ color: GOV_TEXT }}>{lastLockBlock.height ?? "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Smart Contract Name</span><span style={{ color: GOV_TEXT }}>LandRegistryContract</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Timestamp</span><span className="text-xs" style={{ color: GOV_TEXT }}>{lastLockBlock.created_at ? new Date(lastLockBlock.created_at).toLocaleString() : "—"}</span></div>
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Mortgage Recorded on Blockchain</span>
                    </div>
                  </SectionCard>
                )}

                {/* Mortgage History */}
                <SectionCard
                  title="Mortgage History"
                  icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                >
                  {mortgageHistoryItems.length > 0 ? (
                    <ul className="space-y-3">
                      {mortgageHistoryItems.map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: item.released ? GOV_SUCCESS : GOV_BLUE }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: GOV_TEXT }}>{item.year} – {item.label}</p>
                            {item.bankUserId && <p className="text-xs text-gray-500">Bank: {userName(item.bankUserId)}</p>}
                            {item.detail && <p className="text-xs text-gray-500">{item.detail}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No mortgage history for this property.</p>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-6">
                {/* Property Map Panel */}
                <SectionCard
                  title="Property Location"
                  icon={<Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
                >
                  <div className="h-64 rounded-lg overflow-hidden bg-gray-100">
                    <MapView
                      coordinates={prop.geo_coordinates}
                      propertyId={prop.property_id}
                      ownerName={ownerName}
                      statusLabel={underMortgage ? "Under Mortgage" : "Clear"}
                    />
                  </div>
                  <p className="mt-2 text-xs font-mono text-gray-500">Coordinates: {prop.geo_coordinates || "—"}</p>
                </SectionCard>
              </div>
            </div>
          </>
        )}

        {!prop && !loading && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 text-sm">
            Search for a property by Property ID to verify ownership and manage mortgage locks.
          </div>
        )}

        {/* Release confirmation modal */}
        {releaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !releaseSubmitting && setReleaseModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-lg" style={{ color: GOV_TEXT }}>Release Mortgage Lock</h3>
              <p className="text-sm text-gray-600 mt-2">Confirm that the loan has been cleared and you want to remove the mortgage lock on this property.</p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setReleaseModalOpen(false)} disabled={releaseSubmitting} className="flex-1 py-2 rounded-lg border border-gray-300 font-medium text-gray-700">Cancel</button>
                <button type="button" onClick={releaseMortgageLock} disabled={releaseSubmitting} className="flex-1 py-2 rounded-lg text-white font-medium disabled:opacity-70" style={{ backgroundColor: GOV_BLUE }}>{releaseSubmitting ? "Releasing…" : "Release Lock"}</button>
              </div>
            </div>
          </div>
        )}

        {releaseSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm font-medium">
            Loan Cleared – Mortgage Lock Removed
          </div>
        )}
      </div>
    </Layout>
  );
}
