import "@/styles.css";
import "@/lib/api"; // Registers axios 401 interceptor (redirect to login)
import { RouteProgress } from "@/components/RouteProgress";

export default function App({ Component, pageProps }) {
  return (
    <>
      <RouteProgress />
      <Component {...pageProps} />
    </>
  );
}

