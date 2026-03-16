import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";

const GOV_TEXT = "#2C2C2C";

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bhoomi_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOV_TEXT }}>
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your BhoomiChain identity, linked Aadhaar details, and role-based access.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <section className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
              Account Information
            </h2>
            <div className="text-sm text-gray-700 space-y-1.5">
              <div>
                <span className="text-gray-500">Full Name:</span> {user?.name || "—"}
              </div>
              <div>
                <span className="text-gray-500">Email:</span> {user?.email || "—"}
              </div>
              <div>
                <span className="text-gray-500">Role:</span> {user?.role || "—"}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: GOV_TEXT }}>
              Linked Identity (Demo)
            </h2>
            <p className="text-xs text-gray-500">
              In a production deployment this section would show Aadhaar and DigiLocker linkage for this user.
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Aadhaar verification status: <span className="font-medium">Verified (demo)</span></li>
              <li>• DigiLocker documents: Land records, ID proof (demo)</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}

