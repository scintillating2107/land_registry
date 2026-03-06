import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("bhoomi_token");
  window.localStorage.removeItem("bhoomi_user");
  window.location.href = "/login";
}

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      clearAuthAndRedirect();
    }
    return Promise.reject(err);
  }
);

export function getApiBase() {
  return API_BASE;
}

export function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("bhoomi_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function hasAuth() {
  if (typeof window === "undefined") return false;
  return !!(window.localStorage.getItem("bhoomi_token") && window.localStorage.getItem("bhoomi_user"));
}

export default axios;
