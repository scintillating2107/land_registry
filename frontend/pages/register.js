import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { PublicShell } from "@/components/PublicShell";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const ROLES = [
  { value: "CITIZEN", label: "Citizen", desc: "View land, risk score, history" },
  { value: "REGISTRAR", label: "Registrar", desc: "Register land, approve transfers" },
  { value: "BANK", label: "Bank", desc: "Mortgage lock/unlock" },
  { value: "COURT", label: "Court", desc: "Litigation freeze/unfreeze" },
];

const DEMO_CREDENTIALS = [
  { role: "Citizen", email: "alice@citizen.test", password: "password" },
  { role: "Registrar", email: "bob@registrar.test", password: "password" },
  { role: "Bank", email: "bank@bank.test", password: "password" },
  { role: "Court", email: "court@court.test", password: "password" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      const { token, user } = res.data;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("bhoomi_token", token);
        window.localStorage.setItem("bhoomi_user", JSON.stringify(user));
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell
      title="Create account"
      subtitle="Register as a stakeholder to use the land registry portal."
    >
      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 card overflow-hidden">
          <div className="px-6 pt-6 pb-4">

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="input"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Password (min 6 characters)
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`px-3 py-2.5 rounded-lg border text-left transition ${
                          role === r.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block font-medium text-sm">{r.label}</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-2.5 rounded-lg"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="text-center text-slate-600 text-sm mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Demo credentials for sign in */}
            <div className="px-6 pb-6 pt-4 border-t border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Demo sign-in credentials
              </p>
              <p className="text-slate-600 text-xs mb-3">
                To try the portal without registering, use these accounts on the <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link> page. Click “Seed demo users” there first if needed.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left py-2 px-2 font-semibold text-slate-700">Role</th>
                      <th className="text-left py-2 px-2 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-2 px-2 font-semibold text-slate-700">Password</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {DEMO_CREDENTIALS.map((row) => (
                      <tr key={row.email} className="border-t border-slate-200">
                        <td className="py-1.5 px-2 text-slate-700">{row.role}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600">{row.email}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600">{row.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        <aside className="lg:col-span-5 card p-5">
          <div className="text-sm font-semibold text-slate-900">Notes</div>
          <ul className="mt-2 text-sm text-slate-700 space-y-2">
            <li>
              Choose your <span className="font-semibold">role</span> carefully—permissions differ for each stakeholder.
            </li>
            <li>
              For demo/testing, you can skip registration and use the demo accounts on the{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>{" "}
              page.
            </li>
            <li>
              Email domains ending with <span className="font-mono">.test</span> are allowed in this demo environment.
            </li>
          </ul>
        </aside>
      </div>
    </PublicShell>
  );
}
