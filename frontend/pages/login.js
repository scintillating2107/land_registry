import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// Government portal palette
const GOV_BLUE = "#1A73E8";
const GOV_SAFFRON = "#FF9933";
const GOV_BG = "#F5F7FA";
const GOV_TEXT = "#2C2C2C";
const GOV_SUCCESS = "#2E7D32";

function Logo({ className = "h-9 w-9" }) {
  return (
    <img
      src="/images/bhoomichain.png"
      alt="BhoomiChain logo"
      className={className}
    />
  );
}

function IconIdentity() {
  return (
    <svg className="w-8 h-8" fill="none" stroke={GOV_BLUE} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg className="w-8 h-8" fill="none" stroke={GOV_BLUE} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconBlockchain() {
  return (
    <svg className="w-8 h-8" fill="none" stroke={GOV_BLUE} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function IconAadhaar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  );
}

function IconDigiLocker() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function FormField({ id, label, value, error, children }) {
  const hasValue = !!String(value).trim();
  return (
    <div className="block">
      <label
        htmlFor={id}
        className={`block text-sm font-medium mb-1.5 transition-colors ${
          error ? "text-red-600" : hasValue ? "text-[#1A73E8]" : "text-[#5f6368]"
        }`}
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const REG_STEPS = ["Basic Details", "Aadhaar Verification", "DigiLocker Verification", "Account Created"];
const DEMO_ACCOUNTS = [
  { label: "Citizen", name: "Ravi Kumar", email: "ravi.kumar@gmail.com", role: "CITIZEN" },
  { label: "Citizen", name: "Priya Sharma", email: "priya.sharma@gmail.com", role: "CITIZEN" },
  { label: "Registrar", name: "Suresh Reddy", email: "suresh.reddy@gmail.com", role: "REGISTRAR" },
  { label: "Bank", name: "SBI Land Desk", email: "sbiland.desk@gmail.com", role: "BANK" },
  { label: "Court", name: "District Court Registry", email: "court.registry.dl@gmail.com", role: "COURT" },
];
const DEMO_PASSWORD = "Bhoomi@2024";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  useEffect(() => {
    if (router.isReady && router.query.tab === "register") setTab("register");
  }, [router.isReady, router.query.tab]);
  const [regStep, setRegStep] = useState(1);

  // Login state
  const [emailOrAadhaar, setEmailOrAadhaar] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regRole, setRegRole] = useState("CITIZEN");
  const [mobile, setMobile] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regErrors, setRegErrors] = useState({});
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [digilockerConnected, setDigilockerConnected] = useState(false);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const email = emailOrAadhaar.includes("@") ? emailOrAadhaar : `${emailOrAadhaar.replace(/\s/g, "")}@aadhaar.demo`;
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("bhoomi_token", token);
        window.localStorage.setItem("bhoomi_user", JSON.stringify(user));
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setLoginError(msg === "Invalid credentials" ? "Wrong email or password. Use demo accounts below or create an account." : msg);
    } finally {
      setLoginLoading(false);
    }
  }

  function validateStep1() {
    const err = {};
    if (!name.trim()) err.name = "Full name is required";
    if (!email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Enter a valid email address";
    if (!mobile.trim()) err.mobile = "Mobile number is required";
    if (!regPassword) err.regPassword = "Password is required";
    else if (regPassword.length < 6) err.regPassword = "Password must be at least 6 characters";
    if (regPassword !== confirmPassword) err.confirmPassword = "Passwords do not match";
    setRegErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleRegStep1Next() {
    if (!validateStep1()) return;
    setRegStep(2);
  }

  function handleSendOtp() {
    const cleaned = aadhaarNumber.replace(/\s/g, "");
    if (cleaned.length !== 12 || !/^\d+$/.test(cleaned)) {
      setRegErrors({ aadhaar: "Enter a valid 12-digit Aadhaar number" });
      return;
    }
    setRegErrors({});
    setAadhaarLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setAadhaarLoading(false);
    }, 1200);
  }

  function handleVerifyOtp() {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setRegErrors({ otp: "Enter all 6 digits" });
      return;
    }
    setRegErrors({});
    setAadhaarLoading(true);
    setTimeout(() => {
      setAadhaarVerified(true);
      setAadhaarLoading(false);
      setTimeout(() => setRegStep(3), 1500); // show success banner briefly
    }, 800);
  }

  function handleConnectDigiLocker() {
    setDigilockerLoading(true);
    setTimeout(() => {
      setDigilockerConnected(true);
      setDigilockerLoading(false);
    }, 1500);
  }

  async function handleCompleteRegistration() {
    setRegError("");
    setRegLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: regPassword,
        role: regRole,
      });
      const { token, user } = res.data;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("bhoomi_token", token);
        window.localStorage.setItem("bhoomi_user", JSON.stringify(user));
      }
      setRegStep(4);
    } catch (err) {
      setRegError(err.response?.data?.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  function handleOtpChange(index, v) {
    if (v.length > 1) {
      const digits = v.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otpDigits];
      digits.forEach((d, i) => { if (index + i < 6) next[index + i] = d; });
      setOtpDigits(next);
      const nextEl = document.getElementById(`otp-${Math.min(index + digits.length, 5)}`);
      nextEl?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = v.replace(/\D/g, "").slice(-1);
    setOtpDigits(next);
    if (v && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: GOV_BG }}>
      {/* Top Navbar — government style, white, subtle border */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-4 h-16">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Logo className="h-8 w-8 flex-shrink-0" />
            <span className="font-semibold text-base sm:text-lg truncate" style={{ color: GOV_TEXT }}>
              BhoomiChain – National Blockchain Land Registry
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-0 flex-shrink-0">
            <Link href="/" className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-100" style={{ color: GOV_TEXT }}>Home</Link>
            <a href="#technology" className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-100" style={{ color: GOV_TEXT }}>Technology</a>
            <a href="#about" className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-100" style={{ color: GOV_TEXT }}>About Platform</a>
            <a href="#support" className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-100" style={{ color: GOV_TEXT }}>Support</a>
          </nav>
        </div>
      </header>

      {/* Main: two-column grid — left content aligned left, no large overlay */}
      <main className="max-w-[1200px] mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 py-16 lg:py-[64px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-[48px] items-start">
          {/* LEFT COLUMN — Trust and Verification Panel (aligned left, no overlay) */}
          <section className="lg:pt-4 pl-0 pr-2 max-w-full">
            <h2 className="text-2xl font-bold mb-4 text-left" style={{ color: GOV_TEXT }}>
              Secure Digital Identity Verification
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#5f6368" }}>
              BhoomiChain verifies all users through Aadhaar authentication and DigiLocker integration to prevent land fraud and ensure trusted ownership records.
            </p>

            {/* Three horizontal trust blocks — light grey rounded, 16px gap */}
            <div className="space-y-4 mb-[64px]">
              <div className="bg-gray-100 rounded-xl p-4 flex items-start gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-white border border-gray-200">
                  <IconIdentity />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>Aadhaar Authentication</h3>
                  <p className="text-sm mt-0.5 break-words" style={{ color: "#5f6368" }}>Verify identity using UIDAI Aadhaar OTP authentication.</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 flex items-start gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-white border border-gray-200">
                  <IconDocument />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>DigiLocker Integration</h3>
                  <p className="text-sm mt-0.5 break-words" style={{ color: "#5f6368" }}>Securely fetch verified identity and land related documents.</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 flex items-start gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-white border border-gray-200">
                  <IconBlockchain />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: GOV_TEXT }}>Blockchain Security</h3>
                  <p className="text-sm mt-0.5 break-words" style={{ color: "#5f6368" }}>All land records are stored on tamper-proof blockchain infrastructure.</p>
                </div>
              </div>
            </div>

            {/* Verification Process — connected progress nodes with arrows */}
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: GOV_TEXT }}>Verification Process</h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                <span className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium whitespace-nowrap" style={{ color: GOV_TEXT }}>User Identity</span>
                <span className="text-gray-400 flex-shrink-0" aria-hidden="true">→</span>
                <span className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium whitespace-nowrap" style={{ color: GOV_TEXT }}>Aadhaar Verification</span>
                <span className="text-gray-400 flex-shrink-0" aria-hidden="true">→</span>
                <span className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium whitespace-nowrap" style={{ color: GOV_TEXT }}>DigiLocker Document Access</span>
                <span className="text-gray-400 flex-shrink-0" aria-hidden="true">→</span>
                <span className="px-3 py-2 rounded-lg text-sm font-medium text-white whitespace-nowrap" style={{ backgroundColor: GOV_BLUE }}>Secure BhoomiChain Access</span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN — Authentication Card: 420px, 32px padding, 12px radius, subtle shadow */}
          <section className="lg:sticky lg:top-6">
            <div className="w-full max-w-[420px] mx-auto lg:max-w-none bg-white rounded-[12px] border border-gray-200 shadow-md overflow-hidden" style={{ boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.05)" }}>
              {/* Tab switcher */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => { setTab("login"); setRegStep(1); setRegErrors({}); setRegError(""); }}
                  className={`flex-1 py-4 text-sm font-semibold transition ${tab === "login" ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  style={tab === "login" ? { backgroundColor: GOV_BLUE } : {}}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setTab("register"); setLoginError(""); setRegStep(1); setRegErrors({}); }}
                  className={`flex-1 py-4 text-sm font-semibold transition ${tab === "register" ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  style={tab === "register" ? { backgroundColor: GOV_BLUE } : {}}
                >
                  Register
                </button>
              </div>

              <div className="p-8" style={{ padding: "32px" }}>
              {tab === "login" && (
                <>
                  <h3 className="text-xl font-bold mb-6" style={{ color: GOV_TEXT }}>Login to BhoomiChain</h3>
                  <form onSubmit={handleLogin} className="space-y-4" style={{ rowGap: "16px" }}>
                    <FormField id="emailOrAadhaar" label="Email Address or Aadhaar ID" value={emailOrAadhaar} error={undefined}>
                      <input
                        id="emailOrAadhaar"
                        type="text"
                        autoComplete="username"
                        placeholder="e.g. ravi.kumar@gmail.com or 12-digit Aadhaar"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                        value={emailOrAadhaar}
                        onChange={(e) => setEmailOrAadhaar(e.target.value)}
                      />
                    </FormField>
                    <FormField id="password" label="Password" value={password} error={undefined}>
                      <div className="relative">
                        <input
                          id="password"
                          type={showLoginPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="w-full px-3 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </FormField>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-gray-300" style={{ accentColor: GOV_BLUE }} />
                      <span className="text-sm" style={{ color: GOV_TEXT }}>Remember this device</span>
                    </label>
                    {loginError && (
                      <div className="py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {loginError}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="flex-1 py-3 rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-70 transition"
                        style={{ backgroundColor: GOV_BLUE }}
                      >
                        {loginLoading ? "Signing in…" : "Login"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Demo mode: Use the listed demo accounts and password Bhoomi@2024 to log in. Password reset is disabled in this prototype.");
                        }}
                        className="py-3 px-4 rounded-lg font-semibold text-sm border border-gray-300 hover:bg-gray-50 transition"
                        style={{ color: GOV_BLUE }}
                      >
                        Forgot Password
                      </button>
                    </div>
                  </form>
                  <p className="text-center text-sm my-4" style={{ color: "#5f6368" }}>OR</p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full py-3 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                      style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}
                    >
                      <IconAadhaar /> Login with Aadhaar OTP
                    </button>
                    <button
                      type="button"
                      className="w-full py-3 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                      style={{ borderColor: GOV_SAFFRON, color: GOV_SAFFRON }}
                    >
                      <IconDigiLocker /> Login with DigiLocker
                    </button>
                  </div>
                  {/* Security badges — inside card at bottom */}
                  <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex items-center gap-3 text-xs min-w-0" style={{ color: GOV_TEXT }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: GOV_BLUE }}>G</div>
                      <span className="font-medium break-words">Government Identity Verified</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs min-w-0" style={{ color: GOV_TEXT }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: GOV_BLUE }}>B</div>
                      <span className="font-medium break-words">Blockchain Secured Records</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs min-w-0" style={{ color: GOV_TEXT }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: GOV_BLUE }}>E</div>
                      <span className="font-medium break-words">End-to-End Encryption</span>
                    </div>
                  </div>
                  {/* Demo credentials */}
                  <details className="mt-6 border border-gray-200 rounded-lg">
                    <summary className="px-3 py-2 text-xs font-semibold cursor-pointer" style={{ color: GOV_TEXT }}>Demo accounts (password: {DEMO_PASSWORD})</summary>
                    <div className="px-3 pb-3 pt-1 text-xs overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded overflow-hidden min-w-[380px] table-fixed">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="text-left py-1.5 px-2 font-semibold w-20">Role</th>
                            <th className="text-left py-1.5 px-2 font-semibold w-24">Name</th>
                            <th className="text-left py-1.5 px-2 font-semibold min-w-0">Email</th>
                            <th className="text-left py-1.5 px-2 font-semibold w-24">Password</th>
                          </tr>
                        </thead>
                        <tbody>
                          {DEMO_ACCOUNTS.map((acc) => (
                            <tr key={acc.email} className="border-t border-gray-200">
                              <td className="py-1.5 px-2 truncate">{acc.label}</td>
                              <td className="py-1.5 px-2 truncate">{acc.name}</td>
                              <td className="py-1.5 px-2 font-mono text-[11px] truncate" title={acc.email}>{acc.email}</td>
                              <td className="py-1.5 px-2 font-mono truncate">{DEMO_PASSWORD}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>
              )}

              {tab === "register" && (
                <>
                  {/* Progress indicator */}
                  <div className="flex justify-between gap-1 mb-6">
                    {REG_STEPS.map((stepLabel, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            regStep > i + 1 ? "text-white" : regStep === i + 1 ? "text-white" : "text-gray-400 bg-gray-200"
                          }`}
                          style={{ backgroundColor: regStep >= i + 1 ? GOV_BLUE : undefined }}
                        >
                          {regStep > i + 1 ? "✓" : i + 1}
                        </div>
                        <span className="text-[10px] mt-1 text-center hidden sm:block break-words leading-tight" style={{ color: GOV_TEXT }}>{stepLabel}</span>
                      </div>
                    ))}
                  </div>

                  {regStep === 1 && (
                    <>
                      <h3 className="text-lg font-bold mb-4" style={{ color: GOV_TEXT }}>Create Verified BhoomiChain Account</h3>
                      <p className="text-sm mb-4" style={{ color: "#5f6368" }}>Step 1 – Basic Details</p>
                      <div className="space-y-4">
                        <FormField id="reg-name" label="Full Name" value={name} error={regErrors.name}>
                          <input id="reg-name" type="text" autoComplete="name" placeholder="e.g. Ravi Kumar" className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]" value={name} onChange={(e) => setName(e.target.value)} />
                        </FormField>
                        <FormField id="reg-email" label="Email Address" value={email} error={regErrors.email}>
                          <input id="reg-email" type="email" autoComplete="email" placeholder="e.g. ravi.kumar@email.com" className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </FormField>
                        <FormField id="reg-role" label="Register as (Role)" value={regRole} error={regErrors.role}>
                          <select id="reg-role" className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] bg-white" value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                            <option value="CITIZEN">Citizen</option>
                            <option value="REGISTRAR">Registrar</option>
                            <option value="BANK">Bank</option>
                            <option value="COURT">Court</option>
                          </select>
                        </FormField>
                        <FormField id="reg-mobile" label="Mobile Number" value={mobile} error={regErrors.mobile}>
                          <input id="reg-mobile" type="tel" autoComplete="tel" placeholder="e.g. 9876543210" className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                        </FormField>
                        <FormField id="reg-password" label="Create Password" value={regPassword} error={regErrors.regPassword}>
                          <div className="relative">
                            <input
                              id="reg-password"
                              type={showRegPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Min. 6 characters"
                              className="w-full px-3 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword((v) => !v)}
                              className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                              aria-label={showRegPassword ? "Hide password" : "Show password"}
                            >
                              {showRegPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </FormField>
                        <FormField id="reg-confirm" label="Confirm Password" value={confirmPassword} error={regErrors.confirmPassword}>
                          <div className="relative">
                            <input
                              id="reg-confirm"
                              type={showRegConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Re-enter password"
                              className="w-full px-3 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegConfirmPassword((v) => !v)}
                              className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                              aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showRegConfirmPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </FormField>
                        <button type="button" onClick={handleRegStep1Next} className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90" style={{ backgroundColor: GOV_BLUE }}>
                          Continue
                        </button>
                      </div>
                    </>
                  )}

                  {regStep === 2 && (
                    <>
                      <h3 className="text-lg font-bold mb-4" style={{ color: GOV_TEXT }}>Verify Aadhaar Identity</h3>
                      <div className="space-y-4">
                        <FormField id="aadhaar" label="Aadhaar Number" value={aadhaarNumber} error={regErrors.aadhaar}>
                          <input id="aadhaar" type="text" inputMode="numeric" maxLength={14} placeholder="e.g. 234512345678" className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))} />
                        </FormField>
                        <button type="button" onClick={handleSendOtp} disabled={aadhaarLoading} className="w-full py-3 rounded-lg border-2 font-semibold flex items-center justify-center gap-2" style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}>
                          {aadhaarLoading ? "Sending…" : "Send OTP"}
                        </button>
                        {otpSent && (
                          <>
                            <p className="text-sm" style={{ color: GOV_TEXT }}>Enter 6-digit OTP</p>
                            <div className="flex gap-2 justify-center">
                              {[0, 1, 2, 3, 4, 5].map((i) => (
                                <input
                                  key={i}
                                  id={`otp-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8]"
                                  value={otpDigits[i]}
                                  onChange={(e) => handleOtpChange(i, e.target.value)}
                                  onKeyDown={(e) => e.key === "Backspace" && !otpDigits[i] && document.getElementById(`otp-${i - 1}`)?.focus()}
                                />
                              ))}
                            </div>
                            {regErrors.otp && <p className="text-xs text-red-600">{regErrors.otp}</p>}
                            <button type="button" onClick={handleVerifyOtp} disabled={aadhaarLoading} className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-70" style={{ backgroundColor: GOV_BLUE }}>
                              {aadhaarLoading ? "Verifying…" : "Verify OTP"}
                            </button>
                            {aadhaarVerified && (
                              <div className="py-3 px-4 rounded-lg flex items-center gap-2 text-sm font-medium" style={{ backgroundColor: "#E8F5E9", color: GOV_SUCCESS }}>
                                <span className="text-lg">✓</span> Aadhaar verified successfully.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {regStep === 3 && (
                    <>
                      <h3 className="text-lg font-bold mb-2" style={{ color: GOV_TEXT }}>Connect DigiLocker</h3>
                      <p className="text-sm mb-4" style={{ color: "#5f6368" }}>Authorize DigiLocker for secure document access. Your verified identity and land documents will be fetched securely.</p>
                      {!digilockerConnected ? (
                        <button type="button" onClick={handleConnectDigiLocker} disabled={digilockerLoading} className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-white hover:opacity-90 disabled:opacity-70" style={{ backgroundColor: GOV_SAFFRON }}>
                          {digilockerLoading ? "Connecting…" : "Connect DigiLocker"}
                        </button>
                      ) : (
                        <>
                          <div className="space-y-3 mb-4">
                            {["Aadhaar eDocument", "PAN Card", "Land Ownership Records"].map((doc) => (
                              <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                                <span className="font-medium text-sm" style={{ color: GOV_TEXT }}>{doc}</span>
                                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: GOV_SUCCESS }}>✓ Verified</span>
                              </div>
                            ))}
                          </div>
                          {regError && <div className="mb-3 py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{regError}</div>}
                          <button type="button" onClick={handleCompleteRegistration} disabled={regLoading} className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-70" style={{ backgroundColor: GOV_BLUE }}>
                            {regLoading ? "Creating account…" : "Complete Registration"}
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {regStep === 4 && (
                    <>
                      <div className="text-center py-4 animate-fade-in">
                        <div className="inline-flex w-16 h-16 rounded-full items-center justify-center text-3xl font-bold text-white mb-4" style={{ backgroundColor: GOV_SUCCESS }}>✓</div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: GOV_TEXT }}>Identity Verified Successfully</h3>
                        <p className="text-sm mb-6" style={{ color: "#5f6368" }}>Your Aadhaar identity and DigiLocker documents have been verified. You now have secure access to BhoomiChain services.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Link
                            href="/dashboard"
                            className="inline-flex justify-center py-3 px-5 rounded-lg font-semibold text-white hover:opacity-90"
                            style={{ backgroundColor: GOV_BLUE }}
                          >
                            Go to Dashboard
                          </Link>
                          <Link
                            href={regRole === "REGISTRAR" ? "/register-land" : "/services"}
                            className="inline-flex justify-center py-3 px-5 rounded-lg font-semibold border-2 hover:bg-gray-50"
                            style={{ borderColor: GOV_BLUE, color: GOV_BLUE }}
                          >
                            {regRole === "REGISTRAR" ? "Register Land Parcel" : "Explore Services"}
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
