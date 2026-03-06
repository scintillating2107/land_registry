import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { PublicShell } from "@/components/PublicShell";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const DEMO_ACCOUNTS = [
  { label: "Citizen", email: "alice@citizen.test", role: "CITIZEN" },
  { label: "Registrar", email: "bob@registrar.test", role: "REGISTRAR" },
  { label: "Bank", email: "bank@bank.test", role: "BANK" },
  { label: "Court", email: "court@court.test", role: "COURT" },
];
const DEMO_PASSWORD = "password";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loginWithCredentials(nextEmail, nextPassword) {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: nextEmail,
        password: nextPassword,
      });
      const { token, user } = res.data;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("bhoomi_token", token);
        window.localStorage.setItem("bhoomi_user", JSON.stringify(user));
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg === "Invalid credentials" ? "Wrong email or password. Use demo credentials below or seed demo users first." : msg);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithCredentials(email, password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell
      title="Sign in"
      subtitle="Stakeholder login for land registry, transfers, and verification."
    >
      <div className="flex justify-center items-start">
        <div className="w-full max-w-md card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-slate-600 text-sm mt-4">
            Don’t have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>

          {/* Demo credentials for reference */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Demo credentials
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
                  {DEMO_ACCOUNTS.map((acc) => (
                    <tr key={acc.email} className="border-t border-slate-200">
                      <td className="py-1.5 px-2 text-slate-700">{acc.label}</td>
                      <td className="py-1.5 px-2 font-mono text-slate-600">{acc.email}</td>
                      <td className="py-1.5 px-2 font-mono text-slate-600">{DEMO_PASSWORD}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
