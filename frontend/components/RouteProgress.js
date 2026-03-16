import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function RouteProgress() {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timeoutId;

    function start() {
      clearTimeout(timeoutId);
      setActive(true);
    }

    function done() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setActive(false), 180);
    }

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      clearTimeout(timeoutId);
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router.events]);

  if (!active) return null;
  // Do not show progress bar on login page to avoid any overlay
  if (router.pathname === "/login") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20">
      <div className="h-full w-1/2 bg-primary animate-[gov-progress_1.0s_ease-in-out_infinite]" />
    </div>
  );
}

