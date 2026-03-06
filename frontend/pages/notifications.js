import { useEffect, useState } from "react";
import axios, { getApiBase, getAuthHeaders } from "@/lib/api";
import { Layout } from "@/components/Layout";

const API_BASE = getApiBase();

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/notifications/my`, {
        headers: getAuthHeaders(),
      });
      setItems(res.data.notifications || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    setError("");
    try {
      await axios.post(
        `${API_BASE}/api/notifications/${id}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      setError(e.response?.data?.message || "Could not mark read");
    }
  }

  async function markAllRead() {
    setError("");
    try {
      await axios.post(
        `${API_BASE}/api/notifications/read-all`,
        {},
        { headers: getAuthHeaders() }
      );
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      setError(e.response?.data?.message || "Could not mark all read");
    }
  }

  return (
    <Layout>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-600">System updates and workflow events.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary px-3 py-2 rounded-lg text-xs" onClick={load} type="button">
            Refresh
          </button>
          <button className="btn btn-primary px-3 py-2 rounded-lg text-xs" onClick={markAllRead} type="button">
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading && <div className="card p-4 text-sm text-slate-600">Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="card p-4 text-sm text-slate-600">No notifications.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                  <div className="text-sm text-slate-700 mt-1">{n.message}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(n.created_at).toLocaleString()} · {n.type}
                    {n.is_read ? " · Read" : " · Unread"}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    className="btn btn-secondary px-3 py-2 rounded-lg text-xs"
                    type="button"
                    onClick={() => markRead(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

