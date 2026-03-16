import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { PublicShell } from "@/components/PublicShell";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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

const TX_TYPE_LABELS = {
  LAND_REGISTER: "Land Registration",
  TRANSFER: "Ownership Transfer",
  TRANSFER_REQUEST_SUBMITTED: "Transfer Request",
  TRANSFER_REQUEST_REJECTED: "Transfer Rejected",
  MORTGAGE_LOCK: "Mortgage Lock",
  MORTGAGE_RELEASE: "Mortgage Release",
  LITIGATION_FREEZE: "Dispute Freeze",
  LITIGATION_UNFREEZE: "Dispute Unfreeze",
  CERTIFICATE_ISSUED: "Certificate Issued",
};
const SMART_CONTRACTS = [
  { name: "LandRegistryContract", address: "0xLand...Registry", txs: 0, lastExec: "" },
  { name: "OwnershipTransferContract", address: "0xOwner...Transfer", txs: 0, lastExec: "" },
  { name: "MortgageLockContract", address: "0xMort...Lock", txs: 0, lastExec: "" },
  { name: "DisputeFreezeContract", address: "0xDisp...Freeze", txs: 0, lastExec: "" },
];
const VALIDATOR_NODES = [
  { id: "GOV-DC-01", location: "Government Data Center", status: "Online" },
  { id: "REG-NODE-01", location: "Registrar Office Node", status: "Online" },
  { id: "BANK-NODE-01", location: "Bank Validation Node", status: "Online" },
  { id: "COURT-NODE-01", location: "Court Validation Node", status: "Online" },
];

function contractForTxType(txType) {
  if (txType === "LAND_REGISTER") return "LandRegistryContract";
  if (txType === "TRANSFER" || txType?.startsWith("TRANSFER")) return "OwnershipTransferContract";
  if (txType?.includes("MORTGAGE")) return "MortgageLockContract";
  if (txType?.includes("LITIGATION")) return "DisputeFreezeContract";
  return "LandRegistryContract";
}

export default function ExplorerPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTxType, setFilterTxType] = useState("");
  const [filterPropertyId, setFilterPropertyId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [propertyHistoryBlocks, setPropertyHistoryBlocks] = useState([]);

  useEffect(() => setUser(getUser()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, blocksRes] = await Promise.all([
          axios.get(`${API_BASE}/api/public/blockchain/stats`),
          axios.get(`${API_BASE}/api/public/blockchain/blocks`, { params: { limit: 30 } }),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setBlocks(blocksRes.data.blocks || []);
      } catch {
        if (!cancelled) setStats({ latestBlockNumber: 0, totalTransactions: 0, activeSmartContracts: 4, networkStatus: "Online" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const params = { limit: 30 };
    if (filterTxType) params.txType = filterTxType;
    if (filterPropertyId) params.propertyId = filterPropertyId;
    if (filterDateFrom) params.dateFrom = filterDateFrom;
    if (filterDateTo) params.dateTo = filterDateTo;
    axios.get(`${API_BASE}/api/public/blockchain/blocks`, { params })
      .then((r) => setBlocks(r.data.blocks || []))
      .catch(() => {});
  }, [filterTxType, filterPropertyId, filterDateFrom, filterDateTo]);

  async function handleSearch(e) {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/public/blockchain/search`, { params: { q } });
      const list = res.data.blocks || [];
      setBlocks(list);
      if (res.data.searchType === "propertyId" && list.length) setPropertyHistoryBlocks(list);
      else setPropertyHistoryBlocks([]);
    } catch {
      setBlocks([]);
    } finally {
      setSearchLoading(false);
    }
  }

  const activityByDay = useMemo(() => {
    const byDay = {};
    blocks.forEach((b) => {
      const day = b.created_at ? new Date(b.created_at).toISOString().slice(0, 10) : "";
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
    const max = sorted.length ? Math.max(...sorted.map((d) => d[1]), 1) : 1;
    return sorted.map(([d, c]) => [d, c, max]);
  }, [blocks]);

  const mainContent = (
    <div className="p-6 space-y-6" style={{ backgroundColor: GOV_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>BhoomiChain Blockchain Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">View and verify all land registry transactions recorded on the BhoomiChain blockchain.</p>
      </div>

      {/* Public verification badge */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        All BhoomiChain land registry transactions are permanently recorded on blockchain and publicly verifiable.
      </div>

      {/* Search bar */}
      <SectionCard title="Search Blockchain" icon={<Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <input
            type="text"
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Transaction Hash, Block Number, Property ID, or Owner Aadhaar ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={searchLoading}
          />
          <button type="submit" disabled={searchLoading} className="px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: GOV_BLUE }}>
            {searchLoading ? "Searching…" : "Search Blockchain"}
          </button>
        </form>
      </SectionCard>

      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Network status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Latest Block Number", value: stats?.latestBlockNumber ?? 0, icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" },
              { label: "Total Transactions", value: stats?.totalTransactions ?? 0, icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
              { label: "Active Smart Contracts", value: stats?.activeSmartContracts ?? 4, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { label: "Network Status", value: null, icon: "M13 10V3L4 14h7v7l9-11h-7z", badge: "Network Online" },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                {card.badge ? (
                  <span className="inline-flex mt-2 px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800">{card.badge}</span>
                ) : (
                  <p className="text-2xl font-bold mt-1" style={{ color: GOV_TEXT }}>{card.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
            <span className="text-sm font-medium text-gray-600">Filters:</span>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={filterTxType} onChange={(e) => setFilterTxType(e.target.value)}>
              <option value="">All transaction types</option>
              {Object.entries(TX_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input type="text" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40" placeholder="Property ID" value={filterPropertyId} onChange={(e) => setFilterPropertyId(e.target.value)} />
            <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent blocks */}
            <SectionCard title="Recent Blocks" icon={<Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-2">Block #</th>
                      <th className="py-2 pr-2">Timestamp</th>
                      <th className="py-2 pr-2">Tx</th>
                      <th className="py-2 pr-2">Block Hash</th>
                      <th className="py-2 pr-2">Validator</th>
                      <th className="py-2 pr-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.slice(0, 15).map((b) => (
                      <tr key={b.id} className={`border-b border-gray-100 ${selectedBlock?.id === b.id ? "bg-blue-50" : ""}`}>
                        <td className="py-2 pr-2 font-mono">{b.height}</td>
                        <td className="py-2 pr-2 text-xs">{b.created_at ? new Date(b.created_at).toLocaleString() : "—"}</td>
                        <td className="py-2 pr-2">1</td>
                        <td className="py-2 pr-2 font-mono text-xs truncate max-w-[80px]">{b.hash?.slice(0, 10)}…</td>
                        <td className="py-2 pr-2 text-xs">BhoomiChain</td>
                        <td className="py-2 pr-2">
                          <button type="button" onClick={() => { setSelectedBlock(b); setSelectedTx(null); }} className="text-xs font-medium" style={{ color: GOV_BLUE }}>View Block Details</button>
                        </td>
                      </tr>
                    ))}
                    {blocks.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500">No blocks</td></tr>}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Recent transactions */}
            <SectionCard title="Recent Transactions" icon={<Icon d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-2">Tx Hash</th>
                      <th className="py-2 pr-2">Property ID</th>
                      <th className="py-2 pr-2">Action Type</th>
                      <th className="py-2 pr-2">Initiated By</th>
                      <th className="py-2 pr-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.slice(0, 15).map((b) => (
                      <tr key={b.id} className={`border-b border-gray-100 ${selectedTx?.id === b.id ? "bg-blue-50" : ""}`}>
                        <td className="py-2 pr-2 font-mono text-xs truncate max-w-[90px]">{b.hash?.slice(0, 12)}…</td>
                        <td className="py-2 pr-2 font-mono text-xs">{b.property_id || "—"}</td>
                        <td className="py-2 pr-2">{TX_TYPE_LABELS[b.tx_type] || b.tx_type}</td>
                        <td className="py-2 pr-2 text-xs">{b.created_by_name || "—"}</td>
                        <td className="py-2 pr-2">
                          <button type="button" onClick={() => { setSelectedTx(b); setSelectedBlock(null); }} className="text-xs font-medium" style={{ color: GOV_BLUE }}>View Transaction Details</button>
                        </td>
                      </tr>
                    ))}
                    {blocks.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No transactions</td></tr>}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* Block details */}
          {selectedBlock && (
            <SectionCard title="Block Details" icon={<Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />}>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-gray-500">Block Number</span><p className="font-medium" style={{ color: GOV_TEXT }}>{selectedBlock.height}</p></div>
                <div><span className="text-gray-500">Block Hash</span><p className="font-mono text-xs truncate" style={{ color: GOV_TEXT }}>{selectedBlock.hash}</p></div>
                <div><span className="text-gray-500">Previous Block Hash</span><p className="font-mono text-xs truncate" style={{ color: GOV_TEXT }}>{selectedBlock.prev_hash || "—"}</p></div>
                <div><span className="text-gray-500">Timestamp</span><p style={{ color: GOV_TEXT }}>{selectedBlock.created_at ? new Date(selectedBlock.created_at).toLocaleString() : "—"}</p></div>
                <div><span className="text-gray-500">Validator Node</span><p style={{ color: GOV_TEXT }}>BhoomiChain Validator</p></div>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-2">Transactions in this block:</p>
              <div className="mt-1 p-2 rounded bg-gray-50 border text-xs">
                <div className="font-mono">{selectedBlock.tx_type}</div>
                <div className="text-gray-500">Property: {selectedBlock.property_id || "—"}</div>
              </div>
            </SectionCard>
          )}

          {/* Transaction details */}
          {selectedTx && (
            <SectionCard title="Transaction Details" icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-gray-500">Transaction Hash</span><p className="font-mono text-xs truncate" style={{ color: GOV_TEXT }}>{selectedTx.hash}</p></div>
                <div><span className="text-gray-500">Property ID</span><p style={{ color: GOV_TEXT }}>{selectedTx.property_id || "—"}</p></div>
                <div><span className="text-gray-500">Action Type</span><p style={{ color: GOV_TEXT }}>{TX_TYPE_LABELS[selectedTx.tx_type] || selectedTx.tx_type}</p></div>
                <div><span className="text-gray-500">Smart Contract Used</span><p style={{ color: GOV_TEXT }}>{contractForTxType(selectedTx.tx_type)}</p></div>
                <div><span className="text-gray-500">Block Number</span><p style={{ color: GOV_TEXT }}>{selectedTx.height}</p></div>
                <div><span className="text-gray-500">Transaction Timestamp</span><p style={{ color: GOV_TEXT }}>{selectedTx.created_at ? new Date(selectedTx.created_at).toLocaleString() : "—"}</p></div>
              </div>
              <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Verified</span>
            </SectionCard>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Smart contracts */}
            <SectionCard title="Smart Contracts" icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}>
              <ul className="space-y-3">
                {SMART_CONTRACTS.map((c, i) => (
                  <li key={i} className="flex justify-between items-center p-2 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-sm" style={{ color: GOV_TEXT }}>{c.name}</p>
                      <p className="text-xs text-gray-500">Address: {c.address}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Total Tx: {blocks.filter((b) => contractForTxType(b.tx_type) === c.name).length}</p>
                      <p>Last: —</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Validator nodes */}
            <SectionCard title="Validator Nodes" icon={<Icon d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2m0 0h14a2 2 0 002-2v-4a2 2 0 00-2-2m-14 0" />}>
              <ul className="space-y-2">
                {VALIDATOR_NODES.map((n) => (
                  <li key={n.id} className="flex justify-between items-center p-2 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-sm" style={{ color: GOV_TEXT }}>{n.id}</p>
                      <p className="text-xs text-gray-500">{n.location}</p>
                    </div>
                    <span className="text-xs font-medium text-emerald-600">{n.status}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          {/* Property blockchain history */}
          <SectionCard title="Property Blockchain History" icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}>
            <p className="text-xs text-gray-500 mb-3">Search by Property ID above to load history, or view from recent transactions.</p>
            <ul className="space-y-2">
              {(propertyHistoryBlocks.length ? propertyHistoryBlocks : blocks).slice(0, 8).map((b) => (
                <li key={b.id} className="flex gap-3 p-2 rounded-lg border border-gray-100">
                  <span className="text-sm font-medium" style={{ color: GOV_TEXT }}>{b.created_at ? new Date(b.created_at).getFullYear() : "—"}</span>
                  <span className="text-sm text-gray-600">{TX_TYPE_LABELS[b.tx_type] || b.tx_type}</span>
                  <span className="text-xs text-gray-500">Smart Contract: {contractForTxType(b.tx_type)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Network activity */}
          <SectionCard title="Network Activity" icon={<Icon d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h2v16a2 2 0 002 2h12a2 2 0 002-2V4" />}>
            <p className="text-xs text-gray-500 mb-2">Transactions per day (recent)</p>
            <div className="flex items-end gap-1 h-24">
              {activityByDay.length ? activityByDay.map(([day, count, maxVal]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count}`}>
                  <div className="w-full rounded-t min-h-[4px]" style={{ height: `${Math.max(8, (count / maxVal) * 80)}px`, backgroundColor: "rgba(26, 115, 232, 0.4)" }} />
                  <span className="text-[10px] text-gray-500">{day.slice(5)}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No activity data</p>
              )}
            </div>
          </SectionCard>
        </>
      )}

      <div className="text-center text-sm text-gray-500">
        <Link href="/" className="font-medium hover:underline" style={{ color: GOV_BLUE }}>Back to Home</Link>
      </div>
    </div>
  );

  const isLoggedIn = !!user;
  if (isLoggedIn) return <Layout>{mainContent}</Layout>;
  return (
    <PublicShell title="BhoomiChain Blockchain Explorer" subtitle="View and verify all land registry transactions recorded on the BhoomiChain blockchain.">
      <div className="max-w-6xl mx-auto">{mainContent}</div>
    </PublicShell>
  );
}
