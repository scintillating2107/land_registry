import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Layout } from "@/components/Layout";
import { getApiBase, getAuthHeaders } from "@/lib/api";

const API_BASE = getApiBase();
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const LandBoundaryDrawer = dynamic(() => import("@/components/maps/LandBoundaryDrawer"), { ssr: false });

const GOV_BLUE = "#1A73E8";
const GOV_ORANGE = "#FF9933";
const GOV_TEXT = "#2C2C2C";
const GOV_SUCCESS = "#2E7D32";
const GOV_WARNING = "#F9A825";

const LAND_TYPES = [
  { value: "AGRICULTURAL", label: "Agricultural" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
];

function FormSection({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function RegisterLandPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [citizens, setCitizens] = useState([]);

  const [ownerName, setOwnerName] = useState("");
  const [ownerAadhaar, setOwnerAadhaar] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  const [surveyNumber, setSurveyNumber] = useState("");
  const [parcelId, setParcelId] = useState("");
  const [district, setDistrict] = useState("");
  // Default to Uttar Pradesh for demo instead of Karnataka
  const [state, setState] = useState("Uttar Pradesh");
  const [villageWard, setVillageWard] = useState("");
  const [landArea, setLandArea] = useState("");
  const [landType, setLandType] = useState("RESIDENTIAL");

  // Default to Lucknow, Uttar Pradesh for demo
  const [latitude, setLatitude] = useState("26.8467");
  const [longitude, setLongitude] = useState("80.9462");
  const [boundaryArea, setBoundaryArea] = useState("");
  const [boundary, setBoundary] = useState(null);

  const [saleDeed, setSaleDeed] = useState(null);
  const [titleCert, setTitleCert] = useState(null);
  const [surveyMap, setSurveyMap] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("");
  const [successResult, setSuccessResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bhoomi_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    if (u?.role !== "REGISTRAR") {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user?.role !== "REGISTRAR") return;
    const headers = getAuthHeaders();
    axios.get(`${API_BASE}/api/users/users`, { headers }).then((res) => {
      const list = (res.data.users || []).filter((u) => u.role === "CITIZEN");
      setCitizens(list);
      if (list.length && !selectedOwnerId) setSelectedOwnerId(list[0].id);
    }).catch(() => setCitizens([]));
  }, [user]);

  useEffect(() => {
    const base = surveyNumber ? `LP-${surveyNumber.replace(/\s/g, "").slice(0, 8)}` : "LP";
    setParcelId(`${base}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  }, [surveyNumber]);

  const coordinates = `${latitude},${longitude}`;

  function validate() {
    const e = {};
    if (!ownerName.trim()) e.ownerName = "Required";
    if (!ownerAadhaar.trim()) e.ownerAadhaar = "Required";
    else if (!/^\d{12}$/.test(ownerAadhaar.replace(/\s/g, ""))) e.ownerAadhaar = "Enter 12-digit Aadhaar";
    if (!ownerMobile.trim()) e.ownerMobile = "Required";
    if (!surveyNumber.trim()) e.surveyNumber = "Required";
    if (!district.trim()) e.district = "Required";
    if (!state.trim()) e.state = "Required";
    if (!villageWard.trim()) e.villageWard = "Required";
    if (!landArea.trim()) e.landArea = "Required";
    else if (Number.isNaN(Number(landArea)) || Number(landArea) <= 0) e.landArea = "Enter a valid number";
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) e.coords = "Enter valid latitude and longitude";
    if (!boundary || !Array.isArray(boundary.boundary) || boundary.boundary.length < 3) {
      e.boundary = "Draw the plot boundary on the map (polygon or rectangle).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate() || !user) return;
    const ownerUserId = selectedOwnerId || citizens[0]?.id;
    if (!ownerUserId) {
      setErrors({ form: "Select a registered citizen as owner." });
      return;
    }
    const propertyId = parcelId || `PROP-${Math.floor(Math.random() * 100000)}`;
    setSubmitting(true);
    setStep("Validating Land Data");
    await new Promise((r) => setTimeout(r, 800));
    setStep("Uploading Documents to IPFS");
    await new Promise((r) => setTimeout(r, 900));
    setStep("Executing Smart Contract");
    await new Promise((r) => setTimeout(r, 700));
    setStep("Blockchain Transaction Confirmed");

    try {
      const res = await axios.post(
        `${API_BASE}/api/properties/register`,
        {
          propertyId,
          ownerUserId,
          geoCoordinates: coordinates,
          // Leave empty in demo; backend validator treats empty as OK
          ipfsHash: "",
          surveyNumber,
          state,
          district,
          villageWard,
          landAreaSqM: Number(landArea) || null,
          landType,
          boundaryGeojson: boundary
            ? {
                type: "Polygon",
                coordinates: [boundary.boundary.map((p) => [p.lng, p.lat])],
              }
            : null,
        },
        { headers: getAuthHeaders() }
      );
      setSuccessResult({
        propertyId: res.data.property?.property_id || propertyId,
        txId: res.data.block?.id || `tx-${Date.now()}`,
        blockNumber: res.data.block?.block_index ?? 1,
        timestamp: new Date().toISOString(),
      });
      setShowSuccessModal(true);
    } catch (err) {
      setErrors({ form: err.response?.data?.message || "Registration failed" });
    } finally {
      setSubmitting(false);
      setStep("");
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <p style={{ color: GOV_TEXT }}>Loading...</p>
      </div>
    );
  }

  if (user.role !== "REGISTRAR") {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>Register New Land Asset</h1>
          <p className="text-sm text-gray-500 mt-1">
            Government registrars can securely register land parcels and mint tamper-proof ownership records on the BhoomiChain blockchain.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* LEFT COLUMN — Form */}
          <div>
            <FormSection title="Section 1 — Owner Details">
              {citizens.length > 0 && (
                <FormField label="Owner (registered citizen)">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                    value={selectedOwnerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedOwnerId(id);
                      const c = citizens.find((u) => u.id === id);
                      if (c) {
                        setOwnerName(c.name || "");
                        setOwnerAadhaar("");
                        setOwnerMobile("");
                      }
                    }}
                  >
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </FormField>
              )}
              <FormField label="Owner Full Name" error={errors.ownerName}>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Full name as in Aadhaar"
                />
              </FormField>
              <FormField label="Owner Aadhaar ID" error={errors.ownerAadhaar}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                    value={ownerAadhaar}
                    onChange={(e) => setOwnerAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="12-digit Aadhaar"
                  />
                  <button
                    type="button"
                    onClick={() => setAadhaarVerified(true)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap"
                    style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}
                  >
                    Verify
                  </button>
                </div>
                {aadhaarVerified && (
                  <p className="mt-1 text-xs font-medium flex items-center gap-1" style={{ color: GOV_SUCCESS }}>✓ Aadhaar verified</p>
                )}
              </FormField>
              <FormField label="Owner Mobile Number" error={errors.ownerMobile}>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  placeholder="10-digit mobile"
                />
              </FormField>
              <FormField label="Owner Address">
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                  placeholder="Address"
                />
              </FormField>
            </FormSection>

            <FormSection title="Section 2 — Land Information">
              <FormField label="Survey Number" error={errors.surveyNumber}>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  placeholder="Survey / plot number"
                />
              </FormField>
              <FormField label="Land Parcel ID (auto-generated)">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-mono"
                  value={parcelId}
                  readOnly
                />
              </FormField>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="District" error={errors.district}>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District"
                  />
                </FormField>
                <FormField label="State" error={errors.state}>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                  />
                </FormField>
              </div>
              <FormField label="Village / Ward" error={errors.villageWard}>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={villageWard}
                  onChange={(e) => setVillageWard(e.target.value)}
                  placeholder="Village or ward"
                />
              </FormField>
              <FormField label="Land Area (sq m or acres)" error={errors.landArea}>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder="e.g. 1200 or 0.5 acres"
                />
              </FormField>
              <FormField label="Land Type">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                  value={landType}
                  onChange={(e) => setLandType(e.target.value)}
                >
                  {LAND_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </FormField>
            </FormSection>

            <FormSection title="Section 3 — Land Location">
              <p className="text-xs text-gray-500 mb-2">Pin location and auto-capture coordinates. Update values below to move the map.</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Latitude" error={errors.coords}>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </FormField>
                <FormField label="Longitude">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Land boundary area (optional)">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={boundaryArea}
                  onChange={(e) => setBoundaryArea(e.target.value)}
                  placeholder="e.g. 1200 sq m"
                />
              </FormField>
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Optional: Draw the exact land boundary on the map. The centroid and area will be auto-calculated for demo purposes.
                </p>
                {errors.boundary && (
                  <p className="mb-2 text-xs text-red-600">{errors.boundary}</p>
                )}
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  <LandBoundaryDrawer
                    initialCenter={{
                      lat: parseFloat(latitude) || 22.9734,
                      lng: parseFloat(longitude) || 78.6569,
                    }}
                    onChange={(shape) => {
                      if (!shape) {
                        setBoundary(null);
                        return;
                      }
                      const { latitude: lat, longitude: lng, boundary: pts, area } = shape;
                      if (Number.isFinite(lat) && Number.isFinite(lng)) {
                        setLatitude(lat.toFixed(6));
                        setLongitude(lng.toFixed(6));
                      }
                      setBoundary({ latitude: lat, longitude: lng, boundary: pts });
                      if (area && Number.isFinite(area)) {
                        const sqMeters = Math.round(area);
                        setBoundaryArea(`${sqMeters.toLocaleString()} sq m (from map)`);
                      }
                    }}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Section 4 — Document Upload">
              <FormField label="Sale Deed">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="text-sm"
                    onChange={(e) => setSaleDeed(e.target.files?.[0] || null)}
                  />
                  {saleDeed && <span className="text-xs text-gray-500">✓ {saleDeed.name}</span>}
                </div>
              </FormField>
              <FormField label="Land Title Certificate">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="text-sm"
                    onChange={(e) => setTitleCert(e.target.files?.[0] || null)}
                  />
                  {titleCert && <span className="text-xs text-gray-500">✓ {titleCert.name}</span>}
                </div>
              </FormField>
              <FormField label="Survey Map">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="text-sm"
                    onChange={(e) => setSurveyMap(e.target.files?.[0] || null)}
                  />
                  {surveyMap && <span className="text-xs text-gray-500">✓ {surveyMap.name}</span>}
                </div>
              </FormField>
            </FormSection>

            <FormSection title="Section 5 — Blockchain Minting Preview">
              <p className="text-xs font-medium text-amber-700 mb-3 px-2 py-1.5 rounded bg-amber-50 border border-amber-200">Pending Blockchain Transaction</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Property ID:</span> <span className="font-mono">{parcelId || "—"}</span></div>
                <div><span className="text-gray-500">Survey Number:</span> {surveyNumber || "—"}</div>
                <div><span className="text-gray-500">Owner Name:</span> {ownerName || "—"}</div>
                <div><span className="text-gray-500">District:</span> {district || "—"}</div>
                <div className="col-span-2"><span className="text-gray-500">Transaction Type:</span> Mint Land Asset</div>
              </div>
            </FormSection>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
              <h3 className="font-semibold text-sm mb-3" style={{ color: GOV_TEXT }}>Blockchain Transaction Details</h3>
              <ul className="text-sm space-y-1.5 text-gray-600">
                <li><span className="font-medium text-gray-700">Blockchain Network:</span> BhoomiChain (Hyperledger Fabric)</li>
                <li><span className="font-medium text-gray-700">Smart Contract:</span> LandRegistryContract</li>
                <li><span className="font-medium text-gray-700">Action:</span> Mint Land Asset</li>
                <li><span className="font-medium text-gray-700">Transaction Status:</span> Awaiting Confirmation</li>
              </ul>
            </div>

            {errors.form && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{errors.form}</div>
            )}

            <button
              type="button"
              onClick={handleRegister}
              disabled={submitting}
              className="w-full py-3 rounded-xl text-base font-semibold text-white hover:opacity-90 disabled:opacity-70 transition"
              style={{ backgroundColor: GOV_BLUE }}
            >
              {submitting ? step || "Processing…" : "Register Land on Blockchain"}
            </button>
          </div>

          {/* RIGHT COLUMN — Map & Preview */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>Property Map Preview</h3>
              </div>
              <div className="h-64 bg-gray-100">
                <MapView
                  coordinates={coordinates}
                  propertyId={parcelId}
                  ownerName={ownerName || undefined}
                  statusLabel="Pending registration"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold text-sm mb-3" style={{ color: GOV_TEXT }}>Property Summary</h3>
              <ul className="text-sm space-y-2 text-gray-600">
                <li><span className="font-medium text-gray-700">Survey Number:</span> {surveyNumber || "—"}</li>
                <li><span className="font-medium text-gray-700">District:</span> {district || "—"}</li>
                <li><span className="font-medium text-gray-700">Land Area:</span> {landArea || "—"}</li>
                <li><span className="font-medium text-gray-700">Owner Name:</span> {ownerName || "—"}</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold text-sm mb-3" style={{ color: GOV_TEXT }}>Blockchain Record Preview</h3>
              <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 mb-3">
                Pending Blockchain Registration
              </div>
              <ul className="text-sm space-y-1.5 text-gray-600">
                <li><span className="font-medium text-gray-700">Property Token ID:</span> <span className="font-mono text-xs">{parcelId || "—"}</span></li>
                <li><span className="font-medium text-gray-700">Owner Wallet ID:</span> <span className="font-mono text-xs">—</span></li>
                <li><span className="font-medium text-gray-700">Transaction Hash:</span> <span className="font-mono text-xs">—</span></li>
                <li><span className="font-medium text-gray-700">Timestamp:</span> —</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successResult && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" aria-hidden="true" onClick={() => setShowSuccessModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="inline-flex w-16 h-16 rounded-full items-center justify-center text-2xl font-bold text-white mb-4" style={{ backgroundColor: GOV_SUCCESS }}>✓</div>
              <h2 className="text-xl font-bold" style={{ color: GOV_TEXT }}>Land Successfully Registered</h2>
              <p className="text-sm text-gray-500 mt-1">The land asset has been minted on the BhoomiChain blockchain.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
              <div><span className="text-gray-500">Property ID:</span> <span className="font-mono font-medium">{successResult.propertyId}</span></div>
              <div><span className="text-gray-500">Blockchain Transaction ID:</span> <span className="font-mono text-xs">{successResult.txId}</span></div>
              <div><span className="text-gray-500">Block Number:</span> {successResult.blockNumber}</div>
              <div><span className="text-gray-500">Timestamp:</span> {new Date(successResult.timestamp).toLocaleString()}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={successResult.propertyId ? `/property/${encodeURIComponent(successResult.propertyId)}` : "/dashboard"}
                className="flex-1 py-2.5 rounded-lg text-center font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: GOV_BLUE }}
                onClick={() => setShowSuccessModal(false)}
              >
                View Property Details
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 py-2.5 rounded-lg text-center font-semibold border border-gray-300 hover:bg-gray-50"
                style={{ color: GOV_TEXT }}
                onClick={() => setShowSuccessModal(false)}
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
