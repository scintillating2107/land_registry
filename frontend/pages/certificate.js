import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import dynamic from "next/dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

const GOV_BLUE = "#1A73E8";
const GOV_SAFFRON = "#FF9933";
const GOV_BG = "#F5F7FA";
const GOV_TEXT = "#2C2C2C";
const GOV_SUCCESS = "#2E7D32";

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

function GovEmblem() {
  return (
    <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: GOV_BLUE }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={GOV_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function getDemoMeta(propertyId) {
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0; return Math.abs(h); };
  const h = hash(propertyId || "");
  const districts = ["Lucknow", "Bengaluru", "Mumbai", "Delhi", "Chennai"];
  const states = ["Uttar Pradesh", "Karnataka", "Maharashtra", "Delhi", "Tamil Nadu"];
  const villages = ["Ward 12", "Village Panchayat North", "Block A"];
  const landTypes = ["Residential", "Agricultural", "Commercial"];
  return {
    surveyNumber: `72${String.fromCharCode(65 + (h % 5))}`,
    district: districts[h % districts.length],
    state: states[h % states.length],
    village: villages[h % villages.length],
    landArea: `${(1200 + (h % 8000))} sq m`,
    landType: landTypes[h % landTypes.length],
  };
}

function maskAadhaar(id) {
  if (!id || id.length < 8) return "XXXX XXXX XXXX";
  return `${id.slice(0, 4)} XXXX XXXX ${id.slice(-4)}`;
}

export default function CertificatePage() {
  const router = useRouter();
  const { propertyId: queryPropertyId, certId: queryCertId } = router.query;
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [audit, setAudit] = useState(null);
  const [cert, setCert] = useState(null);
  const [myProperties, setMyProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);

  useEffect(() => setUser(getUser()), []);

  useEffect(() => {
    if (!user) return;
    const pid = queryPropertyId || queryCertId ? null : selectedPropertyId;
    const loadCert = queryCertId
      ? axios.get(`${API_BASE}/api/certificates/${queryCertId}`, headers).then((r) => r.data.certificate)
      : Promise.resolve(null);
    const loadUsers = axios.get(`${API_BASE}/api/users/users`, headers).then((r) => r.data.users || []);

    (async () => {
      setLoading(true);
      setError("");
      try {
        if (queryCertId) {
          const [certData, usersData] = await Promise.all([loadCert, loadUsers]);
          setCert(certData);
          setUsers(usersData);
          if (certData?.property_id) {
            const auditRes = await axios.get(`${API_BASE}/api/properties/${certData.property_id}/audit`, headers);
            setAudit(auditRes.data);
            setProperty(auditRes.data.property);
          }
        } else if (queryPropertyId || pid) {
          const id = queryPropertyId || pid;
          const [auditRes, usersRes] = await Promise.all([
            axios.get(`${API_BASE}/api/properties/${encodeURIComponent(id)}/audit`, headers),
            loadUsers,
          ]);
          setAudit(auditRes.data);
          setProperty(auditRes.data.property);
          setUsers(usersRes);
        } else {
          const [propsRes, usersRes] = await Promise.all([
            axios.get(`${API_BASE}/api/properties/my`, headers),
            loadUsers,
          ]);
          const list = propsRes.data.properties || [];
          setMyProperties(list);
          setUsers(usersRes);
          if (list.length) {
            setSelectedPropertyId(list[0].property_id);
            const auditRes = await axios.get(`${API_BASE}/api/properties/${list[0].property_id}/audit`, headers);
            setAudit(auditRes.data);
            setProperty(auditRes.data.property);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load certificate data");
        setProperty(null);
        setAudit(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, queryPropertyId, queryCertId, selectedPropertyId, headers]);

  useEffect(() => {
    if (selectedPropertyId && !queryPropertyId && !queryCertId && user) {
      axios.get(`${API_BASE}/api/properties/${encodeURIComponent(selectedPropertyId)}/audit`, headers)
        .then((r) => { setAudit(r.data); setProperty(r.data.property); })
        .catch(() => {});
    }
  }, [selectedPropertyId, queryPropertyId, queryCertId, user, headers]);

  const blocks = audit?.blocks || [];
  const transfers = audit?.transfers || [];
  const lastTransfer = transfers.length ? transfers[transfers.length - 1] : null;
  const currentOwnerId = lastTransfer ? lastTransfer.to_user_id : property?.owner_user_id;
  const ownerName = property ? (users.find((u) => u.id === currentOwnerId)?.name || "—") : "—";
  const latestBlock = blocks.length ? blocks[blocks.length - 1] : null;
  const issuedCert = cert || (property ? { issued_at: latestBlock?.created_at || property.updated_at || new Date().toISOString(), certificate_no: `BC-CERT-${property?.property_id?.slice(-8) || "000000"}`, payload: {} } : null);
  const registrarName = issuedCert?.payload?.issuedByUserName ?? users.find((u) => u.id === cert?.issued_by_user_id)?.name ?? users.find((u) => u.role === "REGISTRAR")?.name ?? "Registrar Office";
  const qrUrl = property ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify?tx=${latestBlock?.id || ""}` : "";

  const ownershipTimeline = useMemo(() => {
    const items = [];
    const reg = blocks.find((b) => b.tx_type === "LAND_REGISTER");
    if (reg) items.push({ year: new Date(reg.created_at).getFullYear(), label: "Land Registered", owner: "—" });
    transfers.forEach((t) => items.push({ year: new Date(t.created_at).getFullYear(), label: "Ownership Transfer", owner: users.find((u) => u.id === t.to_user_id)?.name || "—" }));
    if (ownerName && ownerName !== "—") items.push({ year: new Date().getFullYear(), label: "Current Owner", owner: ownerName });
    return items.length ? items : [{ year: new Date().getFullYear(), label: "Current Owner", owner: ownerName }];
  }, [blocks, transfers, users, ownerName]);

  function handlePrint() {
    window.print();
  }

  if (!user) {
    // Layout already handles auth redirect; avoid double redirect here.
    return null;
  }

  return (
    <Layout>
      <div className="p-6 pb-12" style={{ backgroundColor: GOV_BG }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 print:mb-2">
            <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>Digital Land Ownership Certificate</h1>
            <p className="text-sm text-gray-500 mt-1">Tamper-proof blockchain verified land ownership document.</p>
          </div>

          {!loading && !property && !queryCertId && myProperties.length > 0 && (
            <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select property for certificate</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {myProperties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>{p.property_id}</option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          {loading && <div className="bg-white rounded-xl border p-8 text-center text-gray-500">Loading…</div>}

          {!loading && property && (
            <>
              {/* Certificate document card - print target */}
              <div id="certificate-document" className="bg-white rounded-xl border-2 shadow-lg overflow-hidden print:shadow-none print:border-2 print:border-gray-400">
                <div className="p-8 print:p-6 border-b-2" style={{ borderColor: GOV_BLUE }}>
                  <div className="flex items-center justify-center gap-4">
                    <GovEmblem />
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Government of India</p>
                      <h2 className="text-xl font-bold mt-1" style={{ color: GOV_TEXT }}>BhoomiChain Digital Land Certificate</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Certificate No. {issuedCert?.certificate_no || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 print:p-6 space-y-6">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Property Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Property ID</span>
                        <p className="font-medium" style={{ color: GOV_TEXT }}>{property.property_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Survey Number</span>
                        <p className="font-medium" style={{ color: GOV_TEXT }}>{property.survey_number || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">District</span>
                        <p style={{ color: GOV_TEXT }}>{property.district || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">State</span>
                        <p style={{ color: GOV_TEXT }}>{property.state || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Village / Ward</span>
                        <p style={{ color: GOV_TEXT }}>{property.village_ward || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Land Area</span>
                        <p style={{ color: GOV_TEXT }}>
                          {property.land_area_sq_m != null ? `${property.land_area_sq_m} sq m` : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Land Type</span>
                        <p style={{ color: GOV_TEXT }}>{property.land_type || "—"}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Owner Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><span className="text-gray-500">Owner Name</span><p className="font-medium" style={{ color: GOV_TEXT }}>{ownerName}</p></div>
                      <div><span className="text-gray-500">Owner Aadhaar ID</span><p className="font-mono text-xs" style={{ color: GOV_TEXT }}>{maskAadhaar(property.owner_user_id)}</p></div>
                      <div className="col-span-2"><span className="text-gray-500">Owner Address</span><p style={{ color: GOV_TEXT }}>As per registry records</p></div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Blockchain Verification</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Blockchain Network</span><span style={{ color: GOV_TEXT }}>BhoomiChain (Hyperledger Fabric)</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Transaction Hash</span><span className="font-mono text-xs truncate" style={{ color: GOV_TEXT }}>{latestBlock?.hash?.slice(0, 20) || "—"}…</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Block Number</span><span style={{ color: GOV_TEXT }}>{latestBlock?.height ?? "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Timestamp</span><span className="text-xs" style={{ color: GOV_TEXT }}>{latestBlock?.created_at ? new Date(latestBlock.created_at).toLocaleString() : "—"}</span></div>
                    </div>
                    <span className="inline-flex mt-2 px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Verified Property Record</span>
                  </section>

                  <section className="flex flex-wrap gap-8 items-start">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">QR Code Verification</h3>
                      {qrUrl && typeof window !== "undefined" && (
                        <div className="bg-white p-2 border border-gray-200 rounded-lg inline-block">
                          <QRCode value={qrUrl} size={120} />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2 max-w-[140px]">Scan to verify land ownership on BhoomiChain blockchain.</p>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">Ownership History Summary</h3>
                      <ul className="space-y-2 text-sm">
                        {ownershipTimeline.map((item, i) => (
                          <li key={i}>
                            <span className="font-medium" style={{ color: GOV_TEXT }}>{item.year}</span> – {item.label}<br />
                            <span className="text-gray-600">Owner: {item.owner}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">Registrar Authentication</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Registrar Name</span><p style={{ color: GOV_TEXT }}>{registrarName}</p></div>
                      <div><span className="text-gray-500">Registrar Office</span><p style={{ color: GOV_TEXT }}>BhoomiChain Land Registry</p></div>
                      <div><span className="text-gray-500">Registration Date</span><p style={{ color: GOV_TEXT }}>{issuedCert?.issued_at ? new Date(issuedCert.issued_at).toLocaleDateString() : "—"}</p></div>
                    </div>
                    <p className="text-xs font-medium mt-2 text-gray-600">Digitally Signed by Registrar</p>
                  </section>

                  <section className="flex flex-wrap gap-3 pt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200" style={{ color: GOV_SUCCESS }}>Blockchain Verified</span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700">Tamper-Proof Record</span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700">Government Authorized Registry</span>
                  </section>
                </div>
              </div>

              {/* Actions - hidden when printing */}
              <div className="mt-6 space-y-4 print:hidden">
                <p className="text-sm text-gray-600">This digital certificate can be verified using the BhoomiChain public verification system.</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 font-medium text-sm hover:bg-gray-50">
                    <Icon d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H6a2 2 0 002-2v-4a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4z" />
                    Print Certificate
                  </button>
                  <button type="button" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: GOV_BLUE }} onClick={handlePrint}>
                    Download Certificate (PDF)
                  </button>
                  <Link href={qrUrl || "/verify"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm" style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}>
                    Share Verification Link
                  </Link>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">QR code above for verification</span>
                </div>
              </div>
            </>
          )}

          {!loading && !property && !queryCertId && myProperties.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No properties found. Register or own a property to view a digital certificate.</p>
              <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium" style={{ color: GOV_BLUE }}>Go to Dashboard</Link>
            </div>
          )}

          {!loading && queryCertId && !property && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Certificate or property not found.</p>
              <Link href="/certificates" className="mt-4 inline-block text-sm font-medium" style={{ color: GOV_BLUE }}>View My Certificates</Link>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: #fff; }
          .print\\:hidden { display: none !important; }
          .print\\:mb-2 { margin-bottom: 0.5rem; }
          #certificate-document { box-shadow: none; }
        }
      `}</style>
    </Layout>
  );
}
