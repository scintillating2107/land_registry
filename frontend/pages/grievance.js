import { useState } from "react";
import axios, { getApiBase } from "@/lib/api";
import { PublicShell } from "@/components/PublicShell";

const API_BASE = getApiBase();

export default function GrievancePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/public/grievances`, {
        name,
        email,
        subject,
        message,
      });
      setResult(res.data.grievance);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell
      title="Grievance & Helpdesk"
      subtitle="Submit a grievance to the registry helpdesk. You will receive a grievance number for follow‑up."
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
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
          <div className="text-sm font-semibold text-slate-900">What happens next</div>
          <ol className="mt-2 text-sm text-slate-700 space-y-2">
            <li>
              <span className="font-semibold">1.</span> Your grievance is recorded with an official number.
            </li>
            <li>
              <span className="font-semibold">2.</span> A registrar reviews and updates the resolution.
            </li>
            <li>
              <span className="font-semibold">3.</span> You may be contacted at the email provided.
            </li>
          </ol>
          <div className="mt-4 text-xs text-slate-600 border border-dashed border-slate-300 rounded-lg px-3 py-2">
            Do not share passwords, OTPs, or sensitive personal data.
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}

