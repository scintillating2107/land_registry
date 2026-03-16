import { Layout } from "@/components/Layout";

const GOV_TEXT = "#2C2C2C";

export default function AccountSettingsPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>
            Account Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure how you sign in to BhoomiChain and how the system communicates important updates.
          </p>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
            Login & Security (Demo)
          </h2>
          <p className="text-xs text-gray-500">
            For the prototype, these settings are informational to explain how a production system would work.
          </p>
          <ul className="text-sm text-gray-700 space-y-1.5">
            <li>• Aadhaar‑linked single sign‑on</li>
            <li>• Optional 2‑factor authentication via OTP</li>
            <li>• Automatic logout after 15 minutes of inactivity</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
            Notifications
          </h2>
          <p className="text-xs text-gray-500">
            Different roles receive different alerts. This section documents the behaviour for the demo.
          </p>
          <ul className="text-sm text-gray-700 space-y-1.5">
            <li>• Email alerts for new land registrations and transfers involving your account</li>
            <li>• SMS alerts for mortgage locks, dispute freezes, and critical changes</li>
            <li>• In‑portal notifications for all non‑critical updates</li>
          </ul>
        </section>
      </div>
    </Layout>
  );
}

