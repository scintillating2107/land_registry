import { useState } from "react";
import axios, { getApiBase } from "@/lib/api";
import { PublicShell } from "@/components/PublicShell";

const API_BASE = getApiBase();

export default function GrievancePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [issueType, setIssueType] = useState("OWNERSHIP_DISPUTE");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const composedSubject = `[${issueType}] ${subject.trim()}`;
      const composedMessage = [
        propertyId ? `Property ID: ${propertyId.trim()}` : "Property ID: Not provided",
        evidenceName ? `Evidence file: ${evidenceName}` : "Evidence file: Not uploaded",
        "",
        message.trim(),
      ].join("\n");
      const res = await axios.post(`${API_BASE}/api/public/grievances`, {
        name,
        email,
        subject: composedSubject,
        message: composedMessage,
      });
      setResult(res.data.grievance);
      setName("");
      setEmail("");
      setPropertyId("");
      setIssueType("OWNERSHIP_DISPUTE");
      setSubject("");
      setMessage("");
      setEvidenceName("");
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell
      title="Dispute Resolution & Helpdesk"
      subtitle="Raise a land dispute, upload evidence details, and receive a tracking number for follow-up."
    >
      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <section className="lg:col-span-7 card p-5">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property ID</label>
                <input
                  className="input"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="e.g. PROP-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue type</label>
                <select className="input" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                  <option value="OWNERSHIP_DISPUTE">Ownership dispute</option>
                  <option value="DOCUMENT_FORGERY">Document forgery</option>
                  <option value="ILLEGAL_SALE">Illegal sale attempt</option>
                  <option value="MORTGAGE_CONFLICT">Mortgage conflict</option>
                  <option value="BOUNDARY_ISSUE">Boundary issue</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Evidence upload</label>
              <input
                className="input"
                type="file"
                onChange={(e) => setEvidenceName(e.target.files?.[0]?.name || "")}
              />
              <div className="mt-1 text-[11px] text-slate-500">
                Demo mode stores the uploaded file name in the dispute record for review.
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dispute details</label>
              <textarea
                className="input min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {result && (
              <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Submitted successfully. Your grievance number is{" "}
                <span className="font-mono font-semibold">{result.grievanceNo}</span>.
              </div>
            )}

            <button className="btn btn-primary px-4 py-2 rounded-lg" disabled={loading} type="submit">
              {loading ? "Submitting…" : "Submit grievance"}
            </button>
          </form>
        </section>

        <aside className="lg:col-span-5 card p-5">
          <div className="text-sm font-semibold text-slate-900">Dispute workflow</div>
          <ol className="mt-2 text-sm text-slate-700 space-y-2">
            <li>
              <span className="font-semibold">1.</span> Your dispute is recorded with an official tracking number.
            </li>
            <li>
              <span className="font-semibold">2.</span> Registry staff reviews ownership, evidence, and fraud signals.
            </li>
            <li>
              <span className="font-semibold">3.</span> Status is updated until the dispute is resolved.
            </li>
          </ol>
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
            Use this module in the demo when a fake seller or forged document is detected. It gives
            judges a clear dispute-resolution story beyond simple registration.
          </div>
          <div className="mt-4 text-xs text-slate-600 border border-dashed border-slate-300 rounded-lg px-3 py-2">
            Do not share passwords, OTPs, or sensitive personal data.
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}

