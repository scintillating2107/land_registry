import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Register is handled on the Secure Identity Access Portal (login page).
 * Redirect to login with Register tab open.
 */
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?tab=register");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <p className="text-[#2C2C2C]">Redirecting to Secure Identity Portal…</p>
    </div>
  );
}
