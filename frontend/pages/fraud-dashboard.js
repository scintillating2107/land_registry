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
const GOV_ALERT_RED = "#D32F2F";

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

function RiskBadge({ level }) {
  const styles = {
    LOW: "bg-emerald-50 border-emerald-200 text-emerald-800",
    MEDIUM: "bg-amber-50 border-amber-200 text-amber-800",
    HIGH: "bg-red-50 border-red-200 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[level] || styles.LOW}`}>
      {level} Risk
    </span>
  );
}

export default function FraudDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState("risk_level");
  const [sortOrder, setSortOrder] = useState("desc");
  const [actionMessage, setActionMessage] = useState("");
  const [audit, setAudit] = useState(null);
  const [users, setUsers] = useState([]);

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);

  useEffect(() => setUser(getUser()), []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "REGISTRAR") {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [user, router]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [res, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/reports/fraud-dashboard`, headers),
        axios.get(`${API_BASE}/api/users/users`, headers),
      ]);
      setData(res.data);
      setUsers(usersRes.data.users || []);
      if (!selected && res.data.transactions?.length) setSelected(res.data.transactions[0]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fraud dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selected?.property_id || !user) return;
    let cancelled = false;
    axios.get(`${API_BASE}/api/properties/${encodeURIComponent(selected.property_id)}/audit`, headers)
      .then((r) => { if (!cancelled) setAudit(r.data); })
      .catch(() => { if (!cancelled) setAudit(null); });
    return () => { cancelled = true; };
  }, [selected?.property_id, user, headers]);

  const sortedTransactions = useMemo(() => {
    const list = data?.transactions || [];
    const key = sortBy;
    const order = sortOrder === "asc" ? 1 : -1;
    const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...list].sort((a, b) => {
      if (key === "risk_level") return order * (riskOrder[b.risk_level] - riskOrder[a.risk_level]);
      if (key === "district") return order * (a.district || "").localeCompare(b.district || "");
      if (key === "timestamp") return order * (new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      return 0;
    });
  }, [data?.transactions, sortBy, sortOrder]);

  const summary = data?.summary || {};
  const userName = (id) => users.find((u) => u.id === id)?.name || "—";
  const blocks = audit?.blocks || [];
  const transfers = audit?.transfers || [];
  const latestBlock = blocks.length ? blocks[blocks.length - 1] : null;
  const ownershipTimelineItems = useMemo(() => {
    const items = [];
    const register = blocks.find((b) => b.tx_type === "LAND_REGISTER");
    if (register) items.push({ year: new Date(register.created_at).getFullYear(), label: "Land Registered", owner: "—", suspicious: false });
    transfers.forEach((t, i) => {
      items.push({
        year: new Date(t.created_at).getFullYear(),
        label: "Ownership Transfer",
        owner: userName(t.to_user_id),
        suspicious: transfers.length > 2 && i >= transfers.length - 2,
      });
    });
    return items;
  }, [blocks, transfers, users]);

  const districtsWithRisk = useMemo(() => {
    const map = {};
    (data?.transactions || []).forEach((t) => {
      const d = t.district || "Unknown";
      if (!map[d]) map[d] = { LOW: 0, MEDIUM: 0, HIGH: 0 };
      map[d][t.risk_level]++;
    });
    return Object.entries(map).map(([name, counts]) => ({
      name,
      ...counts,
      level: counts.HIGH ? "HIGH" : counts.MEDIUM ? "MEDIUM" : "LOW",
    }));
  }, [data?.transactions]);

  if (!user) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }
  if (user.role !== "REGISTRAR") return null;

  return (
    <Layout>
      <div className="p-6 space-y-6" style={{ backgroundColor: GOV_BG }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>AI Fraud Detection Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor suspicious land transactions and detect potential fraud in the BhoomiChain land registry system.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>
        )}

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Loading…</div>
        )}

        {!loading && data && (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Suspicious Transactions Detected", value: summary.suspiciousTransactions ?? 0, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: GOV_WARNING },
                { label: "High Risk Properties", value: summary.highRiskProperties ?? 0, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: GOV_ALERT_RED },
                { label: "Rapid Ownership Transfers", value: summary.rapidOwnershipTransfers ?? 0, icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", color: GOV_SAFFRON },
                { label: "Fraud Alerts Generated", value: summary.fraudAlertsGenerated ?? 0, icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", color: GOV_BLUE },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                    <Icon d={card.icon} className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: GOV_TEXT }}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Table + System Alerts */}
              <div className="lg:col-span-2 space-y-6">
                <SectionCard
                  title="Transaction Monitoring"
                  icon={<Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-2 font-medium">Property ID</th>
                          <th className="py-2 pr-2 font-medium">Owner</th>
                          <th className="py-2 pr-2 font-medium">
                            <button type="button" onClick={() => { setSortBy("district"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="hover:underline">District</button>
                          </th>
                          <th className="py-2 pr-2 font-medium">Transaction Type</th>
                          <th className="py-2 pr-2 font-medium">Fraud Alert</th>
                          <th className="py-2 pr-2 font-medium">
                            <button type="button" onClick={() => { setSortBy("risk_level"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="hover:underline">Risk</button>
                          </th>
                          <th className="py-2 pr-2 font-medium">
                            <button type="button" onClick={() => { setSortBy("timestamp"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="hover:underline">Timestamp</button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTransactions.map((t) => (
                          <tr
                            key={t.property_id}
                            onClick={() => setSelected(t)}
                            className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selected?.property_id === t.property_id ? "bg-blue-50" : ""}`}
                          >
                            <td className="py-2 pr-2 font-mono text-xs">{t.property_id}</td>
                            <td className="py-2 pr-2">{t.owner_name}</td>
                            <td className="py-2 pr-2">{t.district}</td>
                            <td className="py-2 pr-2">{t.transaction_type}</td>
                            <td className="py-2 pr-2 text-amber-700">{t.fraud_alert_type}</td>
                            <td className="py-2 pr-2"><RiskBadge level={t.risk_level} /></td>
                            <td className="py-2 pr-2 text-xs text-gray-500">{t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}</td>
                          </tr>
                        ))}
                        {sortedTransactions.length === 0 && (
                          <tr><td colSpan={7} className="py-6 text-center text-gray-500">No suspicious transactions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard
                  title="System Alerts"
                  icon={<Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />}
                >
                  <ul className="space-y-2">
                    {(data.systemAlerts || []).map((alert, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-amber-600">⚠</span>
                        <span style={{ color: GOV_TEXT }}>{alert}</span>
                      </li>
                    ))}
                    {(!data.systemAlerts || data.systemAlerts.length === 0) && (
                      <li className="text-sm text-gray-500">No recent system alerts.</li>
                    )}
                  </ul>
                </SectionCard>
              </div>

              {/* Right: Detail + Heatmap */}
              <div className="space-y-6">
                {selected ? (
                  <>
                    <SectionCard
                      title="Property Fraud Analysis"
                      icon={<Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                    >
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Property ID</span><p className="font-medium" style={{ color: GOV_TEXT }}>{selected.property_id}</p></div>
                        <div><span className="text-gray-500">Current Owner</span><p style={{ color: GOV_TEXT }}>{selected.owner_name}</p></div>
                        <div><span className="text-gray-500">Transfers in Last Year</span><p style={{ color: GOV_TEXT }}>{selected.transfers_last_year ?? 0}</p></div>
                        <div><span className="text-gray-500">Transaction Frequency</span><p style={{ color: GOV_TEXT }}>{(selected.transfers_last_year ?? 0) > 2 ? "High" : (selected.transfers_last_year ?? 0) > 0 ? "Moderate" : "Low"}</p></div>
                        <div><span className="text-gray-500">AI Fraud Risk Score</span><p className="font-semibold" style={{ color: selected.risk_level === "HIGH" ? GOV_ALERT_RED : selected.risk_level === "MEDIUM" ? GOV_WARNING : GOV_SUCCESS }}>{selected.risk_score ?? 0}%</p></div>
                        <RiskBadge level={selected.risk_level} />
                      </div>
                    </SectionCard>

                    <SectionCard title="Fraud Alert Details" icon={<Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}>
                      <p className="text-sm text-gray-600 mb-2">{selected.fraud_alert_type}</p>
                      <ul className="text-xs space-y-1 text-gray-600">
                        {(selected.fraud_analysis?.alerts || []).map((a, i) => (
                          <li key={i}>• {a.detail || a.title}</li>
                        ))}
                        {(!selected.fraud_analysis?.alerts || selected.fraud_analysis.alerts.length === 0) && (
                          <li>Property ownership or transfer pattern triggered risk rules.</li>
                        )}
                      </ul>
                    </SectionCard>

                    <SectionCard title="Investigation Actions" icon={<Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => setActionMessage("Property flagged for investigation.")} className="w-full py-2 rounded-lg border text-sm font-medium" style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}>Flag Property for Investigation</button>
                        <button type="button" onClick={() => setActionMessage("Registrar notified.")} className="w-full py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700">Notify Registrar</button>
                        <Link href={`/property/${encodeURIComponent(selected.property_id)}`} className="w-full py-2 rounded-lg border border-gray-300 text-sm font-medium text-center text-gray-700">Freeze Property Transfers</Link>
                        <button type="button" onClick={() => setActionMessage("Report generated.")} className="w-full py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700">Generate Investigation Report</button>
                      </div>
                      {actionMessage && <p className="mt-2 text-xs text-emerald-600">{actionMessage}</p>}
                    </SectionCard>

                    <SectionCard title="Blockchain Transaction" icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}>
                      {latestBlock ? (
                        <>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Transaction Hash: <span className="font-mono text-gray-700">{latestBlock.hash?.slice(0, 16)}…</span></p>
                            <p>Block Number: {latestBlock.height ?? "—"}</p>
                            <p>Action Type: {latestBlock.tx_type}</p>
                            <p>Timestamp: {latestBlock.created_at ? new Date(latestBlock.created_at).toLocaleString() : "—"}</p>
                          </div>
                          <span className="inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Verified</span>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Transaction Hash: —</p>
                            <p>Block Number: —</p>
                            <p>Action Type: Land Registry</p>
                            <p>Timestamp: {selected.timestamp ? new Date(selected.timestamp).toLocaleString() : "—"}</p>
                          </div>
                          <span className="inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Verified</span>
                        </>
                      )}
                    </SectionCard>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-sm font-medium mb-2" style={{ color: GOV_TEXT }}>Download Fraud Analysis Report</p>
                      <button
                        type="button"
                        onClick={() => setActionMessage("Report download started (demo).")}
                        className="w-full py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: GOV_BLUE }}
                      >
                        Download Fraud Analysis Report
                      </button>
                      <p className="text-xs text-gray-500 mt-2">Includes: property details, ownership history, AI risk score, fraud alert explanation.</p>
                    </div>
                  </>
                ) : (
                  <SectionCard title="Select a transaction" icon={<Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}>
                    <p className="text-sm text-gray-500">Click a row in the table to view fraud analysis and actions.</p>
                  </SectionCard>
                )}

                <SectionCard title="Fraud Risk by District" icon={<Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}>
                  <div className="space-y-2">
                    {districtsWithRisk.map((d) => (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <span className="text-sm" style={{ color: GOV_TEXT }}>{d.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          d.level === "HIGH" ? "bg-red-100 text-red-800" :
                          d.level === "MEDIUM" ? "bg-amber-100 text-amber-800" :
                          "bg-emerald-100 text-emerald-800"
                        }`}>
                          {d.level} Risk
                        </span>
                      </div>
                    ))}
                    {districtsWithRisk.length === 0 && <p className="text-sm text-gray-500">No district data</p>}
                  </div>
                </SectionCard>
              </div>
            </div>

            {/* Ownership timeline for selected - full width */}
            {selected && (
              <SectionCard
                title="Property Ownership Timeline"
                icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              >
                <ul className="space-y-3">
                  {ownershipTimelineItems.length > 0 ? ownershipTimelineItems.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${item.suspicious ? "bg-amber-500" : "bg-gray-300"}`} style={item.suspicious ? { backgroundColor: GOV_WARNING } : {}} />
                      <div>
                        <p className={`text-sm font-medium ${item.suspicious ? "text-amber-700" : ""}`} style={!item.suspicious ? { color: GOV_TEXT } : {}}>{item.year} – {item.label}</p>
                        <p className="text-xs text-gray-500">Owner: {item.owner}</p>
                      </div>
                    </li>
                  )) : (
                    <>
                      <li className="flex gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2 bg-gray-300" />
                        <div><p className="text-sm font-medium" style={{ color: GOV_TEXT }}>Land Registered</p><p className="text-xs text-gray-500">Owner: —</p></div>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2 bg-gray-300" />
                        <div><p className="text-sm font-medium" style={{ color: GOV_TEXT }}>Ownership Transfer</p><p className="text-xs text-gray-500">Owner: {selected.owner_name}</p></div>
                      </li>
                      {selected.transfers_last_year > 1 && (
                        <li className="flex gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2 bg-amber-500" />
                          <div><p className="text-sm font-medium text-amber-700">Suspicious rapid transfer</p><p className="text-xs text-gray-500">Multiple transfers in short period</p></div>
                        </li>
                      )}
                    </>
                  )}
                </ul>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
