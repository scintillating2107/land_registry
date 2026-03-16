import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";

const GOV_TEXT = "#2C2C2C";

export default function SettingsPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bhoomi_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const role = user?.role || "GUEST";

  const roleLabel =
    role === "CITIZEN"
      ? "Citizen Portal Settings"
      : role === "REGISTRAR"
      ? "Registrar Dashboard Settings"
      : role === "BANK"
      ? "Bank Dashboard Settings"
      : role === "COURT"
      ? "Court Dashboard Settings"
      : "User Settings";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your BhoomiChain account, security, and notification preferences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
              Profile
            </h2>
            <p className="text-xs text-gray-500">
              Basic information used across all BhoomiChain dashboards.
            </p>
            <div className="text-sm space-y-1 text-gray-700">
              <div>
                <span className="text-gray-500">Name:</span> {user?.name || "—"}
              </div>
              <div>
                <span className="text-gray-500">Email:</span> {user?.email || "—"}
              </div>
              <div>
                <span className="text-gray-500">Role:</span> {role}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
              {roleLabel}
            </h2>
            <p className="text-xs text-gray-500">
              Demonstrates how this role would configure their dashboard in a real deployment.
            </p>
            <ul className="text-sm text-gray-700 space-y-1.5">
              {role === "CITIZEN" && (
                <>
                  <li>• Default landing: My Properties dashboard</li>
                  <li>• Show alerts for upcoming tax / mutation deadlines</li>
                  <li>• Notify me when a transfer or mortgage is registered on my land</li>
                </>
              )}
              {role === "REGISTRAR" && (
                <>
                  <li>• Default landing: Pending transfer approvals</li>
                  <li>• Highlight high‑risk properties from AI fraud analysis</li>
                  <li>• Daily summary email of registrations and transfers</li>
                </>
              )}
              {role === "BANK" && (
                <>
                  <li>• Default landing: Active mortgage portfolio</li>
                  <li>• Alerts for properties with disputes or fraud flags</li>
                  <li>• Notify when collateral properties change ownership</li>
                </>
              )}
              {role === "COURT" && (
                <>
                  <li>• Default landing: Active litigation cases</li>
                  <li>• Show properties with overlapping boundaries and fraud flags</li>
                  <li>• Alerts when frozen properties attempt transfers</li>
                </>
              )}
              {role === "GUEST" && (
                <li>• Log in to configure role‑based settings.</li>
              )}
            </ul>
          </section>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
            Security & Notifications
          </h2>
          <p className="text-xs text-gray-500">
            These controls are illustrative for the demo and show how BhoomiChain would integrate with Aadhaar, DigiLocker and government messaging systems.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <h3 className="font-medium mb-1">Login & Identity</h3>
              <ul className="space-y-1">
                <li>• Aadhaar‑linked login (demo)</li>
                <li>• DigiLocker document binding</li>
                <li>• Session timeout: 15 minutes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-1">Alerts</h3>
              <ul className="space-y-1">
                <li>• Email alerts for critical changes</li>
                <li>• SMS alerts for transfers and mortgage locks</li>
                <li>• In‑portal notifications for all roles</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-1">Data & Privacy</h3>
              <ul className="space-y-1">
                <li>• Tamper‑proof blockchain audit trail</li>
                <li>• Role‑based access to land records</li>
                <li>• Citizen consent for data sharing</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

