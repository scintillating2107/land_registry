import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";

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

export default function ApplicationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // citizen form state
  const [myProps, setMyProps] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [citizenNote, setCitizenNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(() => ({ headers: getAuthHeaders() }), []);
  const isRegistrar = user?.role === "REGISTRAR";
  const isCitizen = user?.role === "CITIZEN";
  const focusedApplicationId =
    typeof router.query.applicationId === "string" ? router.query.applicationId : null;

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
      await axios.post(
        `${API_BASE}/api/applications/transfer`,
        { propertyId: propertyId.trim(), toUserId, citizenNote },
        headers
      );
      setPropertyId("");
      setToUserId("");
      setCitizenNote("");
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

  const pendingApps = apps.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW");
  const completedApps = apps.filter((a) => !pendingApps.includes(a));

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-sm text-slate-600">
          {isRegistrar ? "Registrar inbox for transfer requests." : "Submit and track your transfer requests."}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-4">
        {isCitizen && (
          <section className="lg:col-span-5 card p-4">
            <div className="text-sm font-semibold text-slate-900">New transfer request</div>
            <p className="text-xs text-slate-600 mt-1">
              Select a property you own, choose a buyer, and submit the request for registrar approval.
            </p>

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
                <label className="block text-xs text-slate-700 mb-1">Note to registrar (optional)</label>
                <textarea
                  className="input text-sm min-h-[80px]"
                  value={citizenNote}
                  onChange={(e) => setCitizenNote(e.target.value)}
                  placeholder="Sale amount, special conditions, or any explanation for the registrar…"
                />
              </div>

              <button
                className="btn btn-primary px-4 py-2 rounded-lg w-full"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Submitting…" : "Submit transfer request"}
              </button>
            </form>
          </section>
        )}

        <section className={`${isCitizen ? "lg:col-span-7" : "lg:col-span-12"} space-y-3`}>
          <div className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {isRegistrar ? "Pending transfer requests" : "My active applications"}
                </div>
                <div className="text-xs text-slate-600">
                  Workflow: submit → registrar review → approve / reject → certificate.
                </div>
              </div>
              <button className="btn btn-secondary px-3 py-2 rounded-lg text-xs" onClick={refreshAll} type="button">
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="card p-4 text-sm text-slate-600">Loading applications…</div>
          )}

          {!loading && pendingApps.length === 0 && (
            <div className="card p-4 text-sm text-slate-600">
              No pending applications.
              {isCitizen ? " Submit a transfer request to see it here." : " Completed items are listed in history below."}
            </div>
          )}

          {!loading &&
            (focusedApplicationId
              ? [...pendingApps].sort((a, b) =>
                  a.id === focusedApplicationId ? -1 : b.id === focusedApplicationId ? 1 : 0
                )
              : pendingApps
            ).map((a) => {
              const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(a.status);
              return (
                <div
                  key={a.id}
                  className={`card p-4 ${
                    a.id === focusedApplicationId ? "border-2 border-primary shadow-md" : ""
                  }`}
                >
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
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={a.status} />
                    </div>
                  </div>

                  {isRegistrar && (
                    <>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                          type="button"
                          disabled={!isPending}
                          onClick={() => registrarAction(a.id, "review", "Marked under review")}
                        >
                          Mark under review
                        </button>
                        <button
                          className="btn btn-primary px-3 py-2 rounded-lg text-xs"
                          type="button"
                          disabled={!isPending}
                          onClick={() =>
                            registrarAction(
                              a.id,
                              "approve",
                              "Approved after identity, document, mortgage and dispute checks"
                            )
                          }
                        >
                          Approve & transfer ownership
                        </button>
                        <button
                          className="btn px-3 py-2 rounded-lg text-xs border border-red-300 text-red-700 bg-white hover:bg-red-50 transition"
                          type="button"
                          disabled={!isPending}
                          onClick={() =>
                            registrarAction(
                              a.id,
                              "reject",
                              "Rejected: supporting documents or registry data did not match (demo)"
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        <span className="font-semibold">Tip:</span> Approval will only succeed if the seller is still
                        the current owner and there is no active mortgage or dispute on the property.
                      </p>
                    </>
                  )}
                </div>
              );
            })}

          {!loading && completedApps.length > 0 && (
            <div className="space-y-3">
              <div className="mt-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Completed applications (history)
              </div>
              {completedApps.map((a) => (
                <div key={a.id} className="card p-4 bg-slate-50">
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
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={a.status} />
                    </div>
                  </div>
                  {a.status === "APPROVED" && (
                    <div className="mt-3 text-[11px] text-slate-600">
                      Ownership has been updated on blockchain. Check{" "}
                      <Link href="/certificates" className="text-primary font-semibold hover:underline">
                        Certificates
                      </Link>{" "}
                      or{" "}
                      <Link
                        href={`/property/${encodeURIComponent(a.property_id)}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        Property details
                      </Link>{" "}
                      to view the final record.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

