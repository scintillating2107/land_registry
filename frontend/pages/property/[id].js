import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

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

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id: propertyId } = router.query;
  const [user, setUser] = useState(null);
  const [audit, setAudit] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);

  useEffect(() => setUser(getUser()), []);

  useEffect(() => {
    if (!propertyId || !user) return;
    let cancelled = false;
    setError("");
    setLoading(true);
    (async () => {
      try {
        const [auditRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/properties/${encodeURIComponent(propertyId)}/audit`, headers),
          axios.get(`${API_BASE}/api/users/users`, headers),
        ]);
        if (cancelled) return;
        setAudit(auditRes.data);
        setUsers(usersRes.data.users || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load property");
          setAudit(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId, user, headers]);

  const userName = (userId) => users.find((u) => u.id === userId)?.name || "—";
  const prop = audit?.property;
  const blocks = audit?.blocks || [];
  const transfers = audit?.transfers || [];
  const mortgages = audit?.mortgages || [];
  const litigations = audit?.litigations || [];
  const latestBlock = blocks.length ? blocks[blocks.length - 1] : null;
  const lastTransfer = transfers.length ? transfers[transfers.length - 1] : null;
  const currentOwnerId = lastTransfer ? lastTransfer.to_user_id : prop?.owner_user_id;
  const ownerName = currentOwnerId ? userName(currentOwnerId) : "";
  const underMortgage = prop?.mortgage_status === "ACTIVE";
  const underDispute = prop?.litigation_status === "ACTIVE" || prop?.disputed;
  const activeMortgage = mortgages.find((m) => m.status === "ACTIVE");
  const activeLitigation = litigations.find((l) => l.status === "ACTIVE");

  if (!user) {
    // Layout already enforces auth; avoid redirect loop while user is loading.
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[200px]" style={{ backgroundColor: GOV_BG }}>
          <p className="text-gray-500">Loading property…</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[200px]" style={{ backgroundColor: GOV_BG }}>
          <p className="text-gray-500">Loading property…</p>
        </div>
      </Layout>
    );
  }

  if (error || !prop) {
    return (
      <Layout>
        <div className="p-6" style={{ backgroundColor: GOV_BG }}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-red-600">{error || "Property not found."}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium" style={{ color: GOV_BLUE }}>Back to Dashboard</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const coords = prop.geo_coordinates || "26.8467,80.9462";
  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify?propertyId=${encodeURIComponent(prop.property_id)}`
      : "";

  return (
    <Layout>
      <div className="p-6 space-y-6" style={{ backgroundColor: GOV_BG }}>
        {/* Verification badge */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white" style={{ borderColor: GOV_SUCCESS }}>
            <span className="text-lg">✓</span>
            <span className="text-sm font-semibold" style={{ color: GOV_SUCCESS }}>Verified on BhoomiChain Blockchain</span>
          </div>
          <div className="flex items-center gap-2">
            {qrUrl ? (
              <div className="w-20 h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1">
                <QRCode value={qrUrl} size={64} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                QR
              </div>
            )}
            <span className="text-xs text-gray-500">Scan to verify</span>
          </div>
        </div>

        {/* Page header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>Property Details</h1>
          <p className="text-sm mt-1 text-gray-500">View complete land ownership records and blockchain verification.</p>
          <p className="mt-3 font-mono text-sm font-semibold" style={{ color: GOV_BLUE }}>Property ID: {prop.property_id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN — Property Details & Ownership History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Summary Card */}
            <SectionCard
              title="Property Summary"
              icon={<Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><span className="text-gray-500">Property ID</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.property_id}</p></div>
                <div><span className="text-gray-500">Survey Number</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.survey_number || "—"}</p></div>
                <div><span className="text-gray-500">Owner Name</span><p className="font-medium" style={{ color: GOV_TEXT }}>{ownerName}</p></div>
                <div><span className="text-gray-500">District</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.district || "—"}</p></div>
                <div><span className="text-gray-500">State</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.state || "—"}</p></div>
                <div><span className="text-gray-500">Village / Ward</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.village_ward || "—"}</p></div>
                <div><span className="text-gray-500">Land Area</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.land_area_sq_m != null ? `${prop.land_area_sq_m} sq m` : "—"}</p></div>
                <div><span className="text-gray-500">Land Type</span><p className="font-medium" style={{ color: GOV_TEXT }}>{prop.land_type || "—"}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Verified Owner</span>
                {underMortgage && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">Under Mortgage</span>}
                {underDispute && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-800">Dispute Active</span>}
              </div>
            </SectionCard>

            {/* Ownership History Timeline */}
            <SectionCard
              title="Ownership History"
              icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            >
              <ul className="space-y-4">
                {transfers.length === 0 && (
                  <li className="flex gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: GOV_BLUE }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: GOV_TEXT }}>Land Registered</p>
                      <p className="text-xs text-gray-500">Owner: {ownerName}</p>
                      <p className="text-xs text-gray-500">Current</p>
                    </div>
                  </li>
                )}
                {transfers.map((t, i) => (
                  <li key={t.id} className="flex gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: GOV_BLUE }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: GOV_TEXT }}>Ownership Transfer</p>
                      <p className="text-xs text-gray-500">From: {userName(t.from_user_id)} → To: {userName(t.to_user_id)}</p>
                      <p className="text-xs text-gray-500">Tx ID: {t.tx_block_id?.slice(0, 8)}…</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Action buttons by role */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
              {user.role === "CITIZEN" && (
                <>
                  <Link href={`/transfer?propertyId=${encodeURIComponent(prop.property_id)}`} className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: GOV_BLUE }}>Transfer Property</Link>
                  <Link href={`/certificate?propertyId=${encodeURIComponent(prop.property_id)}`} className="inline-flex items-center justify-center px-4 py-2 rounded-lg border font-medium text-sm" style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}>Download Digital Deed</Link>
                </>
              )}
              {user.role === "REGISTRAR" && (
                <Link href={`/transfer?propertyId=${encodeURIComponent(prop.property_id)}`} className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: GOV_BLUE }}>Update Property Records</Link>
              )}
              {user.role === "BANK" && (
                <Link href={`/mortgage?propertyId=${encodeURIComponent(prop.property_id)}`} className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: GOV_BLUE }}>Apply Mortgage Lock</Link>
              )}
              {user.role === "COURT" && (
                <Link href="/grievances-admin" className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: GOV_BLUE }}>Mark Property as Disputed</Link>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Map, Documents, Blockchain */}
          <div className="space-y-6">
            {/* Map */}
            <SectionCard title="Land Location" icon={<Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}>
              <div className="h-48 rounded-lg overflow-hidden bg-gray-100">
                <MapView
                  coordinates={coords}
                  propertyId={prop.property_id}
                  ownerName={ownerName}
                  landArea={prop.land_area_sq_m != null ? `${prop.land_area_sq_m} sq m` : undefined}
                  verified
                  boundaryGeojson={prop.boundary_geojson || null}
                />
              </div>
              <p className="mt-2 text-xs font-mono text-gray-500">Coordinates: {coords}</p>
            </SectionCard>

            {/* Property Documents */}
            <SectionCard title="Property Documents" icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}>
              <ul className="space-y-3">
                {["Land Title Certificate", "Sale Deed", "Survey Map"].map((name, i) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div>
                      <p className="text-sm font-medium" style={{ color: GOV_TEXT }}>{name}</p>
                      <p className="text-xs text-gray-500">IPFS stored • Verified</p>
                    </div>
                    <button type="button" className="text-xs font-medium" style={{ color: GOV_BLUE }}>View Document</button>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Blockchain Verification */}
            <SectionCard title="Blockchain Verification" icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Blockchain Network</span><span style={{ color: GOV_TEXT }}>BhoomiChain (Hyperledger Fabric)</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Smart Contract</span><span style={{ color: GOV_TEXT }}>LandRegistryContract</span></div>
                {latestBlock && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Transaction Hash</span><span className="font-mono text-xs truncate max-w-[140px]" style={{ color: GOV_TEXT }}>{latestBlock.hash?.slice(0, 16)}…</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Block Number</span><span style={{ color: GOV_TEXT }}>{latestBlock.height ?? "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Timestamp</span><span className="text-xs" style={{ color: GOV_TEXT }}>{latestBlock.created_at ? new Date(latestBlock.created_at).toLocaleString() : "—"}</span></div>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Verified on Blockchain</span>
                <Link href={`/verify?tx=${latestBlock?.id}`} className="text-xs font-medium" style={{ color: GOV_BLUE }}>View Transaction</Link>
              </div>
            </SectionCard>

            {/* Mortgage Status */}
            <SectionCard title="Mortgage Status" icon={<Icon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}>
              {underMortgage && activeMortgage ? (
                <>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Bank</span> <span style={{ color: GOV_TEXT }}>{userName(activeMortgage.bank_user_id)}</span></p>
                    <p><span className="text-gray-500">Status</span> <span style={{ color: GOV_TEXT }}>Active</span></p>
                  </div>
                  <div className="mt-3 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">Property Under Mortgage – Ownership Transfer Restricted</div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No active mortgage</p>
              )}
            </SectionCard>

            {/* Dispute Status */}
            <SectionCard title="Dispute Status" icon={<Icon d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2a7 7 0 0114 0v-2m-7 1v10" />}>
              {underDispute && activeLitigation ? (
                <>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Case ID</span> <span style={{ color: GOV_TEXT }}>{activeLitigation.case_reference}</span></p>
                    <p><span className="text-gray-500">Court</span> <span style={{ color: GOV_TEXT }}>{userName(activeLitigation.court_user_id)}</span></p>
                    <p><span className="text-gray-500">Status</span> <span style={{ color: GOV_TEXT }}>Active</span></p>
                  </div>
                  <div className="mt-3 py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium">Ownership Transfers Frozen – Legal Dispute Active</div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No active dispute</p>
              )}
            </SectionCard>

            {/* Digital deed download */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium mb-2" style={{ color: GOV_TEXT }}>Digital Land Certificate</p>
              <p className="text-xs text-gray-500 mb-3">Property ID • Owner • Survey • Area • Blockchain Tx ID</p>
              <Link href={`/certificate?propertyId=${encodeURIComponent(prop.property_id)}`} className="block w-full py-2 rounded-lg text-white font-medium text-sm text-center" style={{ backgroundColor: GOV_BLUE }}>Download Digital Deed</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
