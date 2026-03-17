import { useEffect, useMemo, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import dynamic from "next/dynamic";
import { Layout } from "@/components/Layout";
import Link from "next/link";

const API_BASE = getApiBase();
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const GOV_BLUE = "#1A73E8";
const GOV_SAFFRON = "#FF9933";
const GOV_TEXT = "#2C2C2C";
const GOV_SUCCESS = "#2E7D32";
const GOV_WARNING = "#F9A825";

function getUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("bhoomi_user");
  return stored ? JSON.parse(stored) : null;
}

function authHeaders() {
  return getAuthHeaders();
}

function StatCard({ label, value, icon, hint }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: GOV_TEXT }}>{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [myProps, setMyProps] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [audit, setAudit] = useState(null);
  const [searchPropertyId, setSearchPropertyId] = useState("");
  const [searchAadhaar, setSearchAadhaar] = useState("");
  const [registerForm, setRegisterForm] = useState({
    ownerName: "",
    ownerAadhaar: "",
    surveyNumber: "",
    district: "",
    landArea: "",
    // Default to Lucknow, Uttar Pradesh for demo
    coordinates: "26.8467,80.9462",
    documentNote: "",
  });
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [saleDeedFile, setSaleDeedFile] = useState(null);
  const [titleCertFile, setTitleCertFile] = useState(null);
  const [surveyMapFile, setSurveyMapFile] = useState(null);

  const headers = useMemo(() => ({ headers: authHeaders() }), []);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === "CITIZEN") {
      loadMyProperties();
    }
    if (user.role === "REGISTRAR") {
      loadAllUsers();
      loadApplicationsInbox();
    }
    if (user.role === "BANK" || user.role === "COURT") {
      // Optional: load any role-specific data
    }
  }, [user]);

  async function loadMyProperties() {
    try {
      const res = await axios.get(`${API_BASE}/api/properties/my`, headers);
      setMyProps(res.data.properties || []);
    } catch {
      setMyProps([]);
    }
  }

  async function loadAllUsers() {
    try {
      const res = await axios.get(`${API_BASE}/api/users/users`, headers);
      setAllUsers(res.data.users || []);
    } catch {
      setAllUsers([]);
    }
  }

  async function loadApplicationsInbox() {
    try {
      const res = await axios.get(`${API_BASE}/api/applications/inbox`, headers);
      setApplications(res.data.applications || []);
    } catch {
      setApplications([]);
    }
  }

  async function loadAudit(propertyId) {
    if (!propertyId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/properties/${propertyId}/audit`, headers);
      setAudit(res.data);
    } catch {
      setAudit(null);
    }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  async function handleRegisterLand(e) {
    e.preventDefault();
    const citizen = allUsers.find((u) => u.role === "CITIZEN");
    if (!citizen) {
      showToast("No citizen user found. Create demo users from login page.", "error");
      return;
    }
    setRegistering(true);
    try {
      const propertyId = `PROP-${Math.floor(Math.random() * 100000)}`;
      await axios.post(
        `${API_BASE}/api/properties/register`,
        {
          propertyId,
          ownerUserId: citizen.id,
          geoCoordinates: registerForm.coordinates || "26.8467,80.9462",
          ipfsHash: "QmDemoDocumentHash",
        },
        { headers: authHeaders() }
      );
      showToast(`Land registered: ${propertyId}`);
      setSelectedPropertyId(propertyId);
      loadAudit(propertyId);
      loadApplicationsInbox();
      setRegisterForm({ ownerName: "", ownerAadhaar: "", surveyNumber: "", district: "", landArea: "", coordinates: "26.8467,80.9462", documentNote: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Registration failed", "error");
    } finally {
      setRegistering(false);
    }
  }

  async function bankLockMortgage() {
    if (!selectedPropertyId) {
      showToast("Enter or select a property first.", "error");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/properties/${selectedPropertyId}/mortgage/lock`, {}, { headers: authHeaders() });
      showToast("Mortgage lock applied.");
      loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  }

  async function bankReleaseMortgage() {
    if (!selectedPropertyId) return;
    try {
      await axios.post(`${API_BASE}/api/properties/${selectedPropertyId}/mortgage/release`, {}, { headers: authHeaders() });
      showToast("Mortgage released.");
      loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  }

  async function courtFreeze() {
    if (!selectedPropertyId) return;
    try {
      await axios.post(`${API_BASE}/api/properties/${selectedPropertyId}/litigation/freeze`, { caseReference: "CASE-DEMO" }, { headers: authHeaders() });
      showToast("Land marked as disputed.");
      loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  }

  async function courtUnfreeze() {
    if (!selectedPropertyId) return;
    try {
      await axios.post(`${API_BASE}/api/properties/${selectedPropertyId}/litigation/unfreeze`, {}, { headers: authHeaders() });
      showToast("Dispute status removed.");
      loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div style={{ color: GOV_TEXT }}>Loading...</div>
      </main>
    );
  }

  const totalProps = myProps.length;
  const underMortgage = myProps.filter((p) => p.mortgage_status === "ACTIVE").length;
  const disputed = myProps.filter((p) => p.litigation_status === "ACTIVE" || p.disputed).length;
  const pendingTransfers = applications.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length;

  const roleLabel = { CITIZEN: "Citizen", REGISTRAR: "Registrar", BANK: "Bank Officer", COURT: "Court Officer" }[user.role] || user.role;

  return (
    <Layout>
      {toast.message && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "error" ? "bg-red-100 text-red-800 border border-red-200" : "bg-green-100 text-green-800 border border-green-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: GOV_TEXT }}>{roleLabel} Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage land records and transactions</p>
        </div>

        {/* Summary cards — role-based */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {user.role === "CITIZEN" && (
            <>
              <StatCard label="Total Properties Owned" value={totalProps} hint="In your name" />
              <StatCard label="Under Mortgage" value={underMortgage} hint="Active locks" />
              <StatCard label="Disputed Properties" value={disputed} hint="Legal dispute active" />
              <StatCard label="Recent Activity" value={myProps.length ? "—" : "0"} hint="Last 30 days" />
            </>
          )}
          {user.role === "REGISTRAR" && (
            <>
              <StatCard label="Total Registered Lands" value="—" hint="In registry" />
              <StatCard label="Pending Transfer Requests" value={pendingTransfers} hint="Awaiting approval" />
              <StatCard label="Verified Properties" value="—" hint="Verified" />
              <StatCard label="Recent Registrations" value="—" hint="This week" />
            </>
          )}
          {user.role === "BANK" && (
            <>
              <StatCard label="Active Mortgage Locks" value="—" hint="Current locks" />
              <StatCard label="Loan Collateral Properties" value="—" hint="As collateral" />
              <StatCard label="Recent Mortgage Transactions" value="—" hint="Last 30 days" />
              <StatCard label="Properties" value="—" hint="Verified" />
            </>
          )}
          {user.role === "COURT" && (
            <>
              <StatCard label="Active Land Disputes" value="—" hint="Open cases" />
              <StatCard label="Resolved Cases" value="—" hint="Closed" />
              <StatCard label="Frozen Properties" value="—" hint="Transfer disabled" />
              <StatCard label="Recent Legal Actions" value="—" hint="Last 30 days" />
            </>
          )}
        </div>

        {/* CITIZEN: Owned property list + Map + Timeline */}
        {user.role === "CITIZEN" && (
          <>
            <SectionCard
              title="Owned Property List"
              action={
                <button type="button" onClick={loadMyProperties} className="text-xs font-medium text-primary hover:underline">
                  Refresh
                </button>
              }
            >
              <div className="space-y-3">
                {myProps.length === 0 && (
                  <p className="text-sm text-gray-500">No properties yet. A registrar can register land in your name.</p>
                )}
                {myProps.map((p) => (
                  <div
                    key={p.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary/40 transition cursor-pointer"
                    onClick={() => { setSelectedPropertyId(p.property_id); loadAudit(p.property_id); }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-sm font-semibold" style={{ color: GOV_TEXT }}>{p.property_id}</span>
                        <span className="text-xs text-gray-500 ml-2">Survey: {p.survey_number || "—"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${p.mortgage_status === "ACTIVE" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                          {p.mortgage_status === "ACTIVE" ? "Under Mortgage" : "No Mortgage"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${p.litigation_status === "ACTIVE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                          {p.litigation_status === "ACTIVE" ? "Disputed" : "Clear"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">District: {p.district || "—"} · Area: {p.land_area || "—"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/property/${encodeURIComponent(p.property_id)}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 inline-block"
                        style={{ backgroundColor: GOV_BLUE }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                      <Link href={`/transfer?propertyId=${encodeURIComponent(p.property_id)}`} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 hover:bg-gray-50" style={{ color: GOV_TEXT }} onClick={(e) => e.stopPropagation()}>
                        Transfer Ownership
                      </Link>
                      <Link href={`/certificate?propertyId=${encodeURIComponent(p.property_id)}`} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 hover:bg-gray-50 inline-block" style={{ color: GOV_TEXT }} onClick={(e) => e.stopPropagation()}>
                        Download Digital Deed
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {selectedPropertyId && (
              <SectionCard title="Map — Selected Property">
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                  <MapView coordinates={audit?.property?.geo_coordinates || "26.8467,80.9462"} />
                </div>
              </SectionCard>
            )}

            <SectionCard title="Recent Activity Timeline">
              <ul className="space-y-2">
                {audit?.blocks?.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span>{b.tx_type?.replace(/_/g, " ")}</span>
                    <span className="text-gray-500 text-xs">{new Date(b.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {(!audit?.blocks?.length && !myProps.length) && <li className="text-sm text-gray-500">No recent activity</li>}
              </ul>
            </SectionCard>
          </>
        )}

        {/* REGISTRAR: Register land form + Transfer approval table + Blockchain */}
        {user.role === "REGISTRAR" && (
          <>
            <SectionCard title="Land Registration Panel">
              <form onSubmit={handleRegisterLand} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Owner Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={registerForm.ownerName}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, ownerName: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Owner Aadhaar ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={registerForm.ownerAadhaar}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, ownerAadhaar: e.target.value }))}
                      placeholder="12-digit Aadhaar"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Survey Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={registerForm.surveyNumber}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, surveyNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={registerForm.district}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, district: e.target.value }))}
                      placeholder="e.g. Bangalore Urban"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Land Area</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={registerForm.landArea}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, landArea: e.target.value }))}
                      placeholder="e.g. 1200 sq m"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Coordinates</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={registerForm.coordinates}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, coordinates: e.target.value }))}
                      placeholder="lat,lng"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section 4 — Document Upload</label>
                  <div className="space-y-3 bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Sale Deed</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="text-xs"
                          onChange={(e) => setSaleDeedFile(e.target.files?.[0] || null)}
                        />
                        {saleDeedFile && (
                          <span className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            ✓ {saleDeedFile.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Land Title Certificate</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="text-xs"
                          onChange={(e) => setTitleCertFile(e.target.files?.[0] || null)}
                        />
                        {titleCertFile && (
                          <span className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            ✓ {titleCertFile.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Survey Map</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="text-xs"
                          onChange={(e) => setSurveyMapFile(e.target.files?.[0] || null)}
                        />
                        {surveyMapFile && (
                          <span className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            ✓ {surveyMapFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70"
                  style={{ backgroundColor: GOV_BLUE }}
                >
                  {registering ? "Registering…" : "Register Land on Blockchain"}
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Transfer Approval Table" action={<button type="button" onClick={loadApplicationsInbox} className="text-xs font-medium text-primary hover:underline">Refresh</button>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                      <th className="py-2 pr-2">Property ID</th>
                      <th className="py-2 pr-2">Current Owner</th>
                      <th className="py-2 pr-2">New Buyer</th>
                      <th className="py-2 pr-2">Date</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications
                      .filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW")
                      .slice(0, 10)
                      .map((a) => (
                      <tr key={a.id} className="border-b border-gray-100">
                        <td className="py-2 pr-2 font-mono">{a.property_id || "—"}</td>
                        <td className="py-2 pr-2">{a.from_user_id?.slice(0, 8) || "—"}</td>
                        <td className="py-2 pr-2">{a.to_user_id?.slice(0, 8) || "—"}</td>
                        <td className="py-2 pr-2">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                        <td className="py-2 pr-2">{a.status}</td>
                        <td className="py-2 pr-2">
                          <span className="inline-flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Link
                              href={`/applications?applicationId=${encodeURIComponent(a.id)}`}
                              className="text-xs font-medium text-white px-2.5 py-1.5 rounded bg-primary hover:opacity-90 text-center"
                            >
                              Review / Approve
                            </Link>
                            <Link
                              href={`/property/${encodeURIComponent(a.property_id)}`}
                              className="text-xs font-medium hover:underline text-primary text-center"
                            >
                              View Property
                            </Link>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {applications.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length === 0 && (
                      <tr><td colSpan={6} className="py-4 text-gray-500 text-center">No pending transfers</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <BlockchainPanel audit={audit} selectedPropertyId={selectedPropertyId} loadAudit={loadAudit} setSelectedPropertyId={setSelectedPropertyId} />
          </>
        )}

        {/* BANK: Property search + Mortgage panel + Blockchain */}
        {user.role === "BANK" && (
          <>
            <SectionCard title="Property Search & Details">
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Property ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={searchPropertyId || selectedPropertyId}
                    onChange={(e) => { setSearchPropertyId(e.target.value); setSelectedPropertyId(e.target.value); }}
                    placeholder="e.g. PROP-12345"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Owner Aadhaar ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={searchAadhaar}
                    onChange={(e) => setSearchAadhaar(e.target.value)}
                    placeholder="12-digit Aadhaar"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadAudit(selectedPropertyId)}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
                style={{ color: GOV_TEXT }}
              >
                Load Property
              </button>
              {audit?.property && (
                <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2 text-sm">
                  <div><span className="font-medium">Owner:</span> {audit.property.owner_user_id}</div>
                  <div><span className="font-medium">Survey Number:</span> —</div>
                  <div><span className="font-medium">District:</span> —</div>
                  <div><span className="font-medium">Mortgage Status:</span> {audit.property.mortgage_status}</div>
                  {audit.property.mortgage_status === "ACTIVE" && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold">
                      Property Locked – Transfer Disabled
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={bankLockMortgage} className="px-3 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: GOV_BLUE }}>Apply Mortgage Lock</button>
                    <button type="button" onClick={bankReleaseMortgage} className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50" style={{ color: GOV_TEXT }}>Release Mortgage Lock</button>
                  </div>
                </div>
              )}
            </SectionCard>
            <BlockchainPanel audit={audit} selectedPropertyId={selectedPropertyId} loadAudit={loadAudit} setSelectedPropertyId={setSelectedPropertyId} />
          </>
        )}

        {/* COURT: Property search + Dispute panel + Blockchain */}
        {user.role === "COURT" && (
          <>
            <SectionCard title="Property Search & Dispute Management">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Property ID or Survey Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    placeholder="Search by Property ID or Survey No"
                  />
                  <button type="button" onClick={() => loadAudit(selectedPropertyId)} className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50" style={{ color: GOV_TEXT }}>Search</button>
                </div>
              </div>
              {audit?.property && (
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2 text-sm">
                  <div><span className="font-medium">Owner Name:</span> {audit.property.owner_user_id}</div>
                  <div><span className="font-medium">Survey Number:</span> —</div>
                  <div><span className="font-medium">District:</span> —</div>
                  <div><span className="font-medium">Land Area:</span> —</div>
                  <div><span className="font-medium">Ownership History:</span> See blockchain log below</div>
                  {(audit.property.litigation_status === "ACTIVE" || audit.property.disputed) && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-100 text-red-900 text-xs font-semibold">
                      Ownership Transfers Frozen – Legal Dispute Active
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={courtFreeze} className="px-3 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: GOV_BLUE }}>Mark Land as Disputed</button>
                    <button type="button" onClick={courtUnfreeze} className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50" style={{ color: GOV_TEXT }}>Remove Dispute Status</button>
                  </div>
                </div>
              )}
            </SectionCard>
            <BlockchainPanel audit={audit} selectedPropertyId={selectedPropertyId} loadAudit={loadAudit} setSelectedPropertyId={setSelectedPropertyId} />
          </>
        )}
      </div>
    </Layout>
  );
}

function BlockchainPanel({ audit, selectedPropertyId, loadAudit, setSelectedPropertyId }) {
  const blocks = audit?.blocks || [];
  return (
    <SectionCard
      title="Blockchain Transaction Log"
      action={
        <div className="flex gap-2">
          <input
            type="text"
            className="w-32 px-2 py-1 border border-gray-300 rounded text-xs"
            placeholder="Property ID"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          />
          <button type="button" onClick={() => loadAudit(selectedPropertyId)} className="text-xs font-medium text-primary hover:underline">Load</button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <th className="py-2 pr-2">Block / Tx ID</th>
              <th className="py-2 pr-2">Property ID</th>
              <th className="py-2 pr-2">Action Type</th>
              <th className="py-2 pr-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id} className="border-b border-gray-100">
                <td className="py-2 pr-2 font-mono text-xs">{b.id?.slice(0, 12)}…</td>
                <td className="py-2 pr-2 font-mono text-xs">{audit?.property?.property_id || "—"}</td>
                <td className="py-2 pr-2">{b.tx_type?.replace(/_/g, " ") || "—"}</td>
                <td className="py-2 pr-2 text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {blocks.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-gray-500 text-center">Load a property to see blockchain activity</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
