import { useEffect, useMemo, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import dynamic from "next/dynamic";
import { Layout } from "@/components/Layout";
import { Toast } from "@/components/Toast";
import { RiskGauge } from "@/components/RiskGauge";
import Link from "next/link";

const API_BASE = getApiBase();
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function getUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("bhoomi_user");
  return stored ? JSON.parse(stored) : null;
}

function authHeaders() {
  return getAuthHeaders();
}

function RiskBadge({ score }) {
  let color = "bg-green-100 text-green-800 border-green-300";
  let label = "Low";
  if (score >= 40) {
    color = "bg-red-100 text-red-800 border-red-300";
    label = "High";
  } else if (score >= 25) {
    color = "bg-amber-100 text-amber-800 border-amber-300";
    label = "Medium";
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${color}`}>
      {label} ({score})
    </span>
  );
}

function KpiCard({ label, value, hint, href }) {
  const inner = (
    <div className="card p-4 hover:border-primary transition">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [myProps, setMyProps] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [audit, setAudit] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [appsSummary, setAppsSummary] = useState({ total: 0, pending: 0 });
  const [certCount, setCertCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingWidgets, setLoadingWidgets] = useState(false);

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
    }
    loadWidgets();
  }, [user]);

  async function loadMyProperties() {
    const res = await axios.get(`${API_BASE}/api/properties/my`, {
      headers: authHeaders(),
    });
    setMyProps(res.data.properties || []);
  }

  async function loadAllUsers() {
    const res = await axios.get(`${API_BASE}/api/users/users`, {
      headers: authHeaders(),
    });
    setAllUsers(res.data.users || []);
  }

  async function loadAudit(propertyId) {
    if (!propertyId) return;
    const res = await axios.get(`${API_BASE}/api/properties/${propertyId}/audit`, {
      headers: authHeaders(),
    });
    setAudit(res.data);
  }

  const headers = useMemo(() => ({ headers: authHeaders() }), []);

  async function loadWidgets() {
    if (!user) return;
    setLoadingWidgets(true);
    try {
      const notifRes = await axios
        .get(`${API_BASE}/api/notifications/my`, headers)
        .catch(() => ({ data: { notifications: [] } }));
      setNotifications((notifRes.data?.notifications || []).slice(0, 5));

      if (user.role === "CITIZEN") {
        const [appsRes, certRes] = await Promise.all([
          axios.get(`${API_BASE}/api/applications/my`, headers).catch(() => ({ data: { applications: [] } })),
          axios.get(`${API_BASE}/api/certificates/my`, headers).catch(() => ({ data: { certificates: [] } })),
        ]);
        const list = appsRes.data?.applications || [];
        setAppsSummary({
          total: list.length,
          pending: list.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length,
        });
        setCertCount((certRes.data?.certificates || []).length);
      } else if (user.role === "REGISTRAR") {
        const appsRes = await axios
          .get(`${API_BASE}/api/applications/inbox`, headers)
          .catch(() => ({ data: { applications: [] } }));
        const list = appsRes.data?.applications || [];
        setAppsSummary({
          total: list.length,
          pending: list.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length,
        });
      }
    } finally {
      setLoadingWidgets(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  async function registrarRegisterDemoProperty() {
    const citizen = allUsers.find((u) => u.role === "CITIZEN");
    if (!citizen) {
      showToast("No citizen user found. Seed demo users.", "error");
      return;
    }
    const propertyId = `PROP-${Math.floor(Math.random() * 100000)}`;
    const payload = {
      propertyId,
      ownerUserId: citizen.id,
      geoCoordinates: "12.9716,77.5946",
      ipfsHash: "QmDemoDocumentHash1234567890",
    };
    const res = await axios.post(`${API_BASE}/api/properties/register`, payload, {
      headers: authHeaders(),
    });
    showToast(`Registered property ${res.data.property.property_id}`);
    setSelectedPropertyId(res.data.property.property_id);
    await loadAudit(res.data.property.property_id);
  }

  async function registrarTransferDemo() {
    if (!audit?.property) {
      showToast("Load or register a property first.", "info");
      return;
    }
    const propertyId = audit.property.property_id;
    const citizen = allUsers.find((u) => u.role === "CITIZEN" && u.id !== audit.property.owner_user_id);
    if (!citizen) {
      showToast(
        "Need another citizen user to transfer to (create manually, or adjust logic).",
        "error"
      );
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/api/properties/transfer`,
        {
          propertyId,
          fromUserId: audit.property.owner_user_id,
          toUserId: citizen.id,
        },
        { headers: authHeaders() }
      );
      showToast("Transfer executed.");
      await loadAudit(propertyId);
      setSelectedPropertyId(propertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Transfer failed", "error");
    }
  }

  async function bankLockMortgage() {
    if (!selectedPropertyId) {
      showToast("Set a property ID first.", "info");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/properties/${selectedPropertyId}/mortgage/lock`,
        {},
        { headers: authHeaders() }
      );
      showToast("Mortgage locked.");
      await loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Mortgage lock failed", "error");
    }
  }

  async function bankReleaseMortgage() {
    if (!selectedPropertyId) {
      showToast("Set a property ID first.", "info");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/properties/${selectedPropertyId}/mortgage/release`,
        {},
        { headers: authHeaders() }
      );
      showToast("Mortgage released.");
      await loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Mortgage release failed", "error");
    }
  }

  async function courtFreeze() {
    if (!selectedPropertyId) {
      showToast("Set a property ID first.", "info");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/properties/${selectedPropertyId}/litigation/freeze`,
        { caseReference: "CASE-2026-DEMO" },
        { headers: authHeaders() }
      );
      showToast("Litigation freeze applied.");
      await loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Freeze failed", "error");
    }
  }

  async function courtUnfreeze() {
    if (!selectedPropertyId) {
      showToast("Set a property ID first.", "info");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/properties/${selectedPropertyId}/litigation/unfreeze`,
        {},
        { headers: authHeaders() }
      );
      showToast("Litigation unfreeze applied.");
      await loadAudit(selectedPropertyId);
    } catch (err) {
      showToast(err.response?.data?.message || "Unfreeze failed", "error");
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  const riskForKpi = audit?.property?.risk_score ?? (myProps[0]?.risk_score ?? 0);
  const activeMortgages = myProps.filter((p) => p.mortgage_status === "ACTIVE").length;
  const activeLitigations = myProps.filter((p) => p.litigation_status === "ACTIVE").length;

  return (
    <Layout>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{user.role} Dashboard</h1>
          <p className="text-sm text-slate-600">
            End-to-end view of properties, blockchain audit, and fraud risk.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/applications" className="btn btn-primary px-3 py-2 rounded-lg text-xs">
              Applications workflow
            </Link>
            <Link href="/certificates" className="btn btn-secondary px-3 py-2 rounded-lg text-xs">
              Certificates
            </Link>
            <Link href="/services" className="btn btn-secondary px-3 py-2 rounded-lg text-xs">
              Services directory
            </Link>
            <Link href="/notifications" className="btn btn-secondary px-3 py-2 rounded-lg text-xs">
              Notifications
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <RiskGauge score={riskForKpi} />
          <div className="hidden sm:flex gap-4 text-xs">
            <div>
              <div className="text-slate-500">Active mortgages</div>
              <div className="font-semibold text-slate-800">{activeMortgages}</div>
            </div>
            <div>
              <div className="text-slate-500">Active litigations</div>
              <div className="font-semibold text-slate-800">{activeLitigations}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label={user.role === "REGISTRAR" ? "Total properties" : "My properties"}
          value={user.role === "CITIZEN" ? myProps.length : "—"}
          hint={user.role === "CITIZEN" ? "Owned by you" : "See reports"}
          href={user.role === "CITIZEN" ? "/dashboard" : "/reports"}
        />
        <KpiCard
          label={user.role === "REGISTRAR" ? "Applications (inbox)" : "Applications"}
          value={appsSummary.total}
          hint={`${appsSummary.pending} pending`}
          href="/applications"
        />
        <KpiCard
          label="Certificates"
          value={user.role === "CITIZEN" ? certCount : "—"}
          hint={user.role === "CITIZEN" ? "Issued to you" : "Issued to citizens"}
          href="/certificates"
        />
        <KpiCard
          label="Notifications"
          value={loadingWidgets ? "…" : notifications.length}
          hint="Latest 5 shown"
          href="/notifications"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 space-y-4">
          {/* Citizen view */}
          {user.role === "CITIZEN" && (
            <section className="card p-4">
              <SectionHeader
                title="Owned Properties"
                subtitle="Tap a card to inspect full audit and risk factors."
                action={
                  <button
                    className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                    type="button"
                    onClick={loadMyProperties}
                  >
                    Refresh
                  </button>
                }
              />
              {myProps.length === 0 && (
                <div className="text-sm text-slate-600">
                  No properties yet. Registrar can register one for this citizen.
                </div>
              )}
              <div className="space-y-3 mt-3">
                {myProps.map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-lg p-3 bg-slate-50 hover:border-primary hover:bg-white transition cursor-pointer"
                    onClick={() => {
                      setSelectedPropertyId(p.property_id);
                      loadAudit(p.property_id);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-mono text-sm text-slate-800">{p.property_id}</div>
                        <div className="text-[11px] text-slate-500">
                          Coords: <span className="font-mono">{p.geo_coordinates}</span>
                        </div>
                      </div>
                      <RiskBadge score={p.risk_score} />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.mortgage_status === "ACTIVE" ? "bg-amber-500" : "bg-green-500"
                          }`}
                        />
                        Mortgage: {p.mortgage_status}
                      </span>
                      <span className="mx-1">·</span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.litigation_status === "ACTIVE" ? "bg-red-500" : "bg-green-500"
                          }`}
                        />
                        Litigation: {p.litigation_status}
                      </span>
                      <span className="mx-1">·</span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.disputed ? "bg-red-500" : "bg-green-500"
                          }`}
                        />
                        Disputed: {p.disputed ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card p-4">
            <SectionHeader
              title="Recent notifications"
              subtitle="Updates from applications and approvals."
              action={
                <button
                  className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                  type="button"
                  onClick={loadWidgets}
                >
                  Refresh
                </button>
              }
            />
            <div className="mt-3 space-y-2">
              {loadingWidgets && <div className="text-sm text-slate-600">Loading…</div>}
              {!loadingWidgets && notifications.length === 0 && (
                <div className="text-sm text-slate-600">No notifications yet.</div>
              )}
              {!loadingWidgets &&
                notifications.map((n) => (
                  <div key={n.id} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
                    <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {new Date(n.created_at).toLocaleString()} {n.is_read ? "· Read" : "· Unread"}
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-3">
              <Link href="/notifications" className="text-sm text-primary font-semibold hover:underline">
                Open all notifications
              </Link>
            </div>
          </section>

          {/* Registrar tools */}
          {user.role === "REGISTRAR" && (
            <section className="card p-4 space-y-3">
              <SectionHeader
                title="Registrar actions"
                subtitle="Use the workflow inbox for approvals. Use demo tools to generate sample data."
                action={
                  <div className="flex gap-2">
                    <Link href="/reports" className="btn btn-secondary px-3 py-2 rounded-lg text-xs">
                      Reports
                    </Link>
                    <Link href="/grievances-admin" className="btn btn-secondary px-3 py-2 rounded-lg text-xs">
                      Grievances
                    </Link>
                  </div>
                }
              />
              <div className="text-xs text-slate-600 mb-1">
                1. Click &quot;Register Demo Property&quot; to create a property for a citizen.
              </div>
              <button
                onClick={registrarRegisterDemoProperty}
                className="px-4 py-2 rounded border-2 border-primary bg-primary text-white hover:bg-primaryDark text-sm font-semibold"
              >
                Register Demo Property
              </button>
              <div className="text-xs text-slate-600 mt-3">
                2. Use the real demo workflow:
              </div>
              <Link
                href="/applications"
                className="inline-flex items-center justify-center px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-sm text-slate-800"
              >
                Open Applications Inbox
              </Link>
              <div className="text-[11px] text-slate-500">
                (The old direct-transfer button is kept for reference below.)
              </div>
              <button
                onClick={registrarTransferDemo}
                className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-sm text-slate-800"
              >
                Execute Transfer (legacy demo)
              </button>
            </section>
          )}

          {/* Bank tools */}
          {user.role === "BANK" && (
            <section className="card p-4 space-y-3">
              <SectionHeader
                title="Bank mortgage controls"
                subtitle="Apply a mortgage lock/release. Locks block transfers."
                action={
                  <button
                    type="button"
                    className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                    onClick={() => loadAudit(selectedPropertyId)}
                  >
                    Load audit
                  </button>
                }
              />
              <label className="block text-xs text-slate-600 mb-1">Property ID to operate on</label>
              <input
                className="input text-sm mb-2"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={bankLockMortgage}
                  className="btn btn-primary px-4 py-2 rounded-lg text-xs"
                >
                  Lock Mortgage
                </button>
                <button
                  onClick={bankReleaseMortgage}
                  className="btn btn-secondary px-4 py-2 rounded-lg text-xs"
                >
                  Release Mortgage
                </button>
              </div>
              {audit?.property?.property_id === selectedPropertyId && (
                <div className="text-xs text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div>
                    <span className="font-semibold">Current status:</span> Mortgage{" "}
                    {audit.property.mortgage_status} · Litigation {audit.property.litigation_status} ·
                    Disputed {audit.property.disputed ? "Yes" : "No"}
                  </div>
                  <div className="mt-1">
                    Risk: <span className="font-semibold">{audit.property.risk_score}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Court tools */}
          {user.role === "COURT" && (
            <section className="card p-4 space-y-3">
              <SectionHeader
                title="Court litigation controls"
                subtitle="Freeze/unfreeze transfers during legal proceedings."
                action={
                  <button
                    type="button"
                    className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                    onClick={() => loadAudit(selectedPropertyId)}
                  >
                    Load audit
                  </button>
                }
              />
              <label className="block text-xs text-slate-600 mb-1">Property ID to operate on</label>
              <input
                className="input text-sm mb-2"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={courtFreeze}
                  className="btn btn-primary px-4 py-2 rounded-lg text-xs"
                >
                  Freeze Property
                </button>
                <button
                  onClick={courtUnfreeze}
                  className="btn btn-secondary px-4 py-2 rounded-lg text-xs"
                >
                  Unfreeze Property
                </button>
              </div>
              {audit?.property?.property_id === selectedPropertyId && (
                <div className="text-xs text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div>
                    <span className="font-semibold">Current status:</span> Mortgage{" "}
                    {audit.property.mortgage_status} · Litigation {audit.property.litigation_status} ·
                    Disputed {audit.property.disputed ? "Yes" : "No"}
                  </div>
                  <div className="mt-1">
                    Risk: <span className="font-semibold">{audit.property.risk_score}</span>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right side: audit + map */}
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="font-semibold mb-2 text-slate-900">Property Audit &amp; Map</h2>
            <label className="block text-xs text-slate-600 mb-1">
              Property ID (click card or paste manually)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                className="input flex-1 text-sm"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              />
              <button
                onClick={() => loadAudit(selectedPropertyId)}
                className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
              >
                Load
              </button>
            </div>
            {audit && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-mono text-[11px]">{audit.property.property_id}</div>
                    <div className="text-[11px] text-slate-600">
                      Current owner ID:{" "}
                      <span className="font-mono">{audit.property.owner_user_id}</span>
                    </div>
                  </div>
                  <RiskBadge score={audit.property.risk_score} />
                </div>
                <div className="text-slate-700 space-y-1">
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    Mortgage {audit.property.mortgage_status} · Litigation{" "}
                    {audit.property.litigation_status} · Disputed{" "}
                    {audit.property.disputed ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-semibold">IPFS hash:</span>{" "}
                    <span className="font-mono break-all">{audit.property.ipfs_hash || "-"}</span>
                  </div>
                </div>
                <div className="h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <MapView coordinates={audit.property.geo_coordinates} />
                </div>
                <div>
                  <div className="font-semibold mb-1">Timeline</div>
                  <ol className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {audit.blocks.map((b, idx) => (
                      <li key={b.id} className="flex items-start gap-2">
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              b.tx_type === "TRANSFER"
                                ? "bg-sky-400"
                                : b.tx_type.includes("MORTGAGE")
                                ? "bg-amber-400"
                                : b.tx_type.includes("LITIGATION")
                                ? "bg-red-400"
                                : "bg-emerald-400"
                            }`}
                          />
                          {idx !== audit.blocks.length - 1 && (
                            <div className="flex-1 w-px bg-slate-700 mt-1" />
                          )}
                        </div>
                        <div className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white flex-1">
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
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            {!audit && (
              <div className="text-xs text-slate-600">
                Select or load a property to see full on-chain audit and event timeline.
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

