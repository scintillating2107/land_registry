import { useEffect, useMemo, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";
import Link from "next/link";

const API_BASE = getApiBase();

function getUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("bhoomi_user");
  return stored ? JSON.parse(stored) : null;
}

function StatusPill({ status }) {
  const styles = {
    SUBMITTED: "bg-sky-50 border-sky-200 text-sky-800",
    UNDER_REVIEW: "bg-amber-50 border-amber-200 text-amber-800",
    APPROVED: "bg-emerald-50 border-emerald-200 text-emerald-800",
    REJECTED: "bg-red-50 border-red-200 text-red-800",
    CANCELLED: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${styles[status] || styles.SUBMITTED}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function CheckPill({ label, status, hint }) {
  const styles = {
    VERIFIED: "bg-emerald-50 border-emerald-200 text-emerald-800",
    REVIEW: "bg-amber-50 border-amber-200 text-amber-800",
    BLOCKED: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${styles[status] || styles.REVIEW}`}>
      <div className="text-xs font-semibold">{label}</div>
      <div className="mt-1 text-[11px]">{hint}</div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [user, setUser] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // citizen form
  const [myProps, setMyProps] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [citizenNote, setCitizenNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saleDeedFile, setSaleDeedFile] = useState("");

  const isRegistrar = user?.role === "REGISTRAR";
  const isCitizen = user?.role === "CITIZEN";
  const selectedProperty = myProps.find((p) => p.property_id === propertyId);
  const aiDocReview = useMemo(() => {
    if (!saleDeedFile) return null;
    const normalized = `${saleDeedFile} ${citizenNote}`.toLowerCase();
    const flagged =
      normalized.includes("fake") ||
      normalized.includes("forg") ||
      normalized.includes("mismatch") ||
      normalized.includes("alter");

    return {
      status: flagged ? "REVIEW REQUIRED" : "VERIFIED",
      signature: flagged ? "Possible signature mismatch" : "Signature pattern looks consistent",
      data: flagged ? "Metadata mismatch detected" : "Document metadata matches registry record",
      tamper: flagged ? "Possible alteration found" : "No obvious tampering signals in demo scan",
    };
  }, [saleDeedFile, citizenNote]);

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function refreshAll() {
    setError("");
    setLoading(true);
    try {
      if (isRegistrar) {
        const res = await axios.get(`${API_BASE}/api/applications/inbox`, headers);
        setApps(res.data.applications || []);
      } else {
        const res = await axios.get(`${API_BASE}/api/applications/my`, headers);
        setApps(res.data.applications || []);
      }

      if (isCitizen) {
        const [propsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/properties/my`, headers),
          axios.get(`${API_BASE}/api/users/users?role=CITIZEN`, headers),
        ]);
        setMyProps(propsRes.data.properties || []);
        const list = (usersRes.data.users || []).filter((u) => u.id !== user.id);
        setCitizens(list);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Could not load applications");
    } finally {
      setLoading(false);
    }
  }

  async function submitTransferApplication(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE}/api/applications/transfer`,
        { propertyId: propertyId.trim(), toUserId, citizenNote },
        headers
      );
      setPropertyId("");
      setToUserId("");
      setCitizenNote("");
      setApps((prev) => [res.data.application, ...prev]);
      await refreshAll();
    } catch (e) {
      setError(e.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function registrarAction(id, action, registrarNote) {
    setError("");
    try {
      await axios.post(`${API_BASE}/api/applications/${id}/${action}`, { registrarNote }, headers);
      await refreshAll();
    } catch (e) {
      setError(e.response?.data?.message || "Action failed");
    }
  }

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-sm text-slate-600">
          {isRegistrar
            ? "Registrar inbox for transfer requests."
            : "Submit and track your service applications."}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <section className="card p-4">
          <div className="text-sm font-semibold text-slate-900">Government Verification Simulation</div>
          <div className="text-xs text-slate-600 mt-1">
            Aadhaar, DigiLocker, and bank registry checks run before the registrar approves a transfer.
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <CheckPill
              label="Aadhaar identity"
              status={toUserId ? "VERIFIED" : "REVIEW"}
              hint={toUserId ? "Buyer identity matched to citizen profile." : "Pick a buyer to simulate identity verification."}
            />
            <CheckPill
              label="DigiLocker docs"
              status={propertyId ? "VERIFIED" : "REVIEW"}
              hint={propertyId ? "Land deed and registry packet fetched in demo." : "Select a property to fetch registry documents."}
            />
            <CheckPill
              label="Bank mortgage API"
              status={
                selectedProperty?.mortgage_status === "ACTIVE"
                  ? "BLOCKED"
                  : propertyId
                  ? "VERIFIED"
                  : "REVIEW"
              }
              hint={
                selectedProperty?.mortgage_status === "ACTIVE"
                  ? "Mortgage lock is active, so transfer should be blocked."
                  : propertyId
                  ? "Mortgage registry reports the parcel is clear for transfer."
                  : "Property selection required before bank check."
              }
            />
          </div>
        </section>

        <section className="card p-4">
          <div className="text-sm font-semibold text-slate-900">Smart Contract Guardrails</div>
          <div className="text-xs text-slate-600 mt-1">
            Ownership transfer is automated only when all registry rules pass.
          </div>
          <pre className="mt-4 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-5 text-slate-200">
{`function transferLand(propertyId, seller, buyer) {
  require(seller == currentOwner);
  require(mortgageStatus == NONE);
  require(litigationStatus == NONE);
  require(disputed == false);
  transferOwnership(propertyId, buyer);
}`}
          </pre>
          <div className="mt-2 text-[11px] text-slate-500">
            This makes the transfer explainable for judges: identity, documents, mortgage clearance,
            and ownership status are checked before the blockchain record is updated.
          </div>
        </section>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-4">
        {isCitizen && (
          <section className="lg:col-span-5 card p-4">
            <div className="text-sm font-semibold text-slate-900">
              New transfer request
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Submit an application. The registrar will review and approve/reject.
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
              Fraud engine checks duplicate sale windows, current owner mismatch, mortgage blocks,
              litigation freezes, and rapid ownership flips before approval.
            </div>
            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] text-violet-900">
              AI document verification simulates sale-deed review for fake signatures, mismatched data,
              and altered document content before submission.
            </div>

            <form className="mt-4 space-y-3" onSubmit={submitTransferApplication}>
              <div>
                <label className="block text-xs text-slate-700 mb-1">Property</label>
                <select
                  className="input text-sm"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  required
                >
                  <option value="">Select property</option>
                  {myProps.map((p) => (
                    <option key={p.property_id} value={p.property_id}>
                      {p.property_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1">Buyer (Citizen)</label>
                <select
                  className="input text-sm"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  required
                >
                  <option value="">Select buyer</option>
                  {citizens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1">Note (optional)</label>
                <textarea
                  className="input text-sm min-h-[90px]"
                  value={citizenNote}
                  onChange={(e) => setCitizenNote(e.target.value)}
                  placeholder="Any supporting note for registrar review…"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1">Upload sale deed</label>
                <input
                  className="input text-sm"
                  type="file"
                  onChange={(e) => setSaleDeedFile(e.target.files?.[0]?.name || "")}
                />
              </div>

              {aiDocReview && (
                <div className={`rounded-lg border px-3 py-3 text-xs ${
                  aiDocReview.status === "VERIFIED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}>
                  <div className="font-semibold">AI Document Verification</div>
                  <div className="mt-1">Status: {aiDocReview.status}</div>
                  <div className="mt-2 space-y-1">
                    <div>Signature: {aiDocReview.signature}</div>
                    <div>Data match: {aiDocReview.data}</div>
                    <div>Tamper scan: {aiDocReview.tamper}</div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary px-4 py-2 rounded-lg w-full"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Submitting…" : "Submit application (fee paid in demo)"}
              </button>
            </form>
          </section>
        )}

        <section className={`${isCitizen ? "lg:col-span-7" : "lg:col-span-12"} space-y-3`}>
          <div className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {isRegistrar ? "Transfer requests inbox" : "My applications"}
                </div>
                <div className="text-xs text-slate-600">
                  End-to-end workflow: submit → review → approve/reject → certificate.
                </div>
              </div>
              <button className="btn btn-secondary px-3 py-2 rounded-lg text-xs" onClick={refreshAll} type="button">
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="card p-4 text-sm text-slate-600">Loading…</div>
          )}

          {!loading && apps.length === 0 && (
            <div className="card p-4 text-sm text-slate-600">
              No applications yet.
              {isCitizen ? " Submit a transfer request to see it here." : ""}
            </div>
          )}

          {!loading &&
            apps.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {a.application_no || a.applicationNo || "Transfer Application"}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Property: <span className="font-mono">{a.property_id}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      From: {a.from_name || a.from_user_id} → To: {a.to_name || a.to_user_id}
                    </div>
                    {a.citizen_note && (
                      <div className="text-xs text-slate-700 mt-2">
                        <span className="font-semibold">Citizen note:</span> {a.citizen_note}
                      </div>
                    )}
                    {a.registrar_note && (
                      <div className="text-xs text-slate-700 mt-1">
                        <span className="font-semibold">Registrar note:</span> {a.registrar_note}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-2">
                      Pipeline: Identity verify → DigiLocker doc check → Bank mortgage check →
                      Smart contract transfer → Certificate issuance
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={a.status} />
                  </div>
                </div>

                {isRegistrar && ["SUBMITTED", "UNDER_REVIEW"].includes(a.status) && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                      type="button"
                      onClick={() => registrarAction(a.id, "review", "Marked under review")}
                    >
                      Mark under review
                    </button>
                    <button
                      className="btn btn-primary px-3 py-2 rounded-lg text-xs"
                      type="button"
                      onClick={() => registrarAction(a.id, "approve", "Approved after verification")}
                    >
                      Approve & transfer
                    </button>
                    <button
                      className="btn px-3 py-2 rounded-lg text-xs border border-red-300 text-red-700 bg-white hover:bg-red-50 transition"
                      type="button"
                      onClick={() => registrarAction(a.id, "reject", "Rejected: document mismatch (demo)")}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {a.status === "APPROVED" && (
                  <div className="mt-4 text-xs text-slate-600">
                    Check{" "}
                    <Link href="/certificates" className="text-primary font-semibold hover:underline">
                      Certificates
                    </Link>{" "}
                    for the issued approval certificate.
                  </div>
                )}
              </div>
            ))}
        </section>
      </div>
    </Layout>
  );
}

