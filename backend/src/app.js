require('dotenv').config();
require('express-async-errors');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { authRouter } = require('./routes/auth.routes');
const { propertyRouter } = require('./routes/property.routes');
const { publicRouter } = require('./routes/public.routes');
const { userRouter } = require('./routes/user.routes');
const { applicationsRouter } = require('./routes/applications.routes');
const { notificationsRouter } = require('./routes/notifications.routes');
const { grievancesRouter } = require('./routes/grievances.routes');
const { reportsRouter } = require('./routes/reports.routes');
const { certificatesRouter } = require('./routes/certificates.routes');

const { authMiddleware } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic rate limiting for auth + protected APIs
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bhoomichain-backend' });
});

// Standalone logs viewer (for hackathon judges) — no Postman required.
// This page logs in via /api/auth/login and then calls /api/reports/system-logs with Authorization header.
app.get('/logs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BhoomiChain — Backend Logs</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Liberation Sans"; background:#f5f7fa; color:#0f172a; }
      .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
      .card { background:#fff; border:1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 1px 2px rgba(16,24,40,0.06); }
      .head { padding: 18px 18px 10px; border-bottom: 1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      h1 { margin: 0; font-size: 18px; }
      .sub { margin: 6px 0 0; font-size: 12px; color:#475569; }
      .body { padding: 16px 18px 18px; }
      label { display:block; font-size: 12px; color:#334155; margin-bottom: 6px; font-weight: 600; }
      input, select { width: 100%; padding: 10px 10px; border:1px solid #d1d5db; border-radius: 10px; font-size: 13px; }
      .row { display:grid; grid-template-columns: 1fr 1fr 140px; gap: 10px; }
      .row2 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
      @media (max-width: 820px) { .row { grid-template-columns: 1fr; } }
      @media (max-width: 820px) { .row2 { grid-template-columns: 1fr; } }
      button { appearance:none; border:0; border-radius: 10px; padding: 10px 12px; font-weight: 700; font-size: 13px; cursor:pointer; }
      .btn { background:#1A73E8; color:#fff; }
      .btn2 { background:#0B3C5D; color:#fff; }
      .btnGhost { background:#fff; border:1px solid #d1d5db; color:#0f172a; }
      .pill { display:inline-flex; align-items:center; gap:8px; padding: 6px 10px; border-radius: 999px; border:1px solid #e5e7eb; font-size: 12px; color:#334155; background:#fff; }
      .ok { border-color:#bbf7d0; background:#ecfdf5; color:#065f46; }
      .bad { border-color:#fecaca; background:#fef2f2; color:#7f1d1d; }
      pre { margin: 0; background:#0b1220; color:#e5e7eb; padding: 14px; border-radius: 12px; border: 1px solid #111827; overflow:auto; font-size: 11px; line-height: 1.45; }
      .grid { display:grid; grid-template-columns: 1fr; gap: 12px; }
      details { background:#fff; border:1px solid #e5e7eb; border-radius: 14px; overflow:hidden; }
      summary { cursor:pointer; user-select:none; padding: 12px 14px; font-weight: 800; font-size: 12px; color:#0f172a; display:flex; justify-content:space-between; align-items:center; gap:10px; }
      summary::-webkit-details-marker { display:none; }
      .count { font-size: 11px; color:#64748b; font-weight: 700; }
      .panel { padding: 0 14px 14px; }
      .actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:flex-end; }
      .muted { color:#64748b; font-size: 12px; }
      .err { margin-top: 10px; padding: 10px 12px; border-radius: 12px; border:1px solid #fecaca; background:#fef2f2; color:#991b1b; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="head">
          <div>
            <h1>BhoomiChain — Backend System Logs (Simulation)</h1>
            <div class="sub">Login as Registrar, then view blockchain blocks, applications, transfers, certificates, payments, notifications.</div>
          </div>
          <div class="actions">
            <span id="integrity" class="pill">Chain integrity: —</span>
            <span id="stamp" class="pill">Generated: —</span>
          </div>
        </div>
        <div class="body">
          <div class="row">
            <div>
              <label>Registrar email</label>
              <input id="email" value="suresh.reddy@gmail.com" />
            </div>
            <div>
              <label>Password</label>
              <input id="password" type="password" value="Bhoomi@2024" />
            </div>
            <div>
              <label>Limit</label>
              <select id="limit">
                <option value="20">20</option>
                <option value="50" selected>50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>

          <div class="row2">
            <div>
              <label>Filter by Property ID (optional)</label>
              <input id="filterProperty" placeholder="e.g. BC-UP-LKO-1234A" />
            </div>
            <div>
              <label>Filter by Application No (optional)</label>
              <input id="filterApp" placeholder="e.g. TRF-202603..." />
            </div>
            <div>
              <label>Auto-refresh</label>
              <select id="refresh">
                <option value="0" selected>Off</option>
                <option value="3000">Every 3s</option>
                <option value="5000">Every 5s</option>
                <option value="10000">Every 10s</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="btnLogin">Login & Load Logs</button>
            <button class="btnGhost" id="btnRefresh" disabled>Refresh</button>
            <button class="btn2" id="btnCopy" disabled>Copy JSON</button>
            <span class="muted" id="status"></span>
          </div>

          <div id="error" class="err" style="display:none;"></div>

          <div class="grid" style="margin-top: 14px;">
            <details open>
              <summary>Raw JSON <span class="count" id="rawCount">—</span></summary>
              <div class="panel">
                <pre id="out">Login to load logs…</pre>
              </div>
            </details>

            <details open>
              <summary>Blockchain blocks <span class="count" id="blocksCount">—</span></summary>
              <div class="panel"><pre id="blocksOut">—</pre></div>
            </details>

            <details open>
              <summary>Transfer applications <span class="count" id="appsCount">—</span></summary>
              <div class="panel"><pre id="appsOut">—</pre></div>
            </details>

            <details>
              <summary>Transfers <span class="count" id="transfersCount">—</span></summary>
              <div class="panel"><pre id="transfersOut">—</pre></div>
            </details>

            <details>
              <summary>Certificates <span class="count" id="certsCount">—</span></summary>
              <div class="panel"><pre id="certsOut">—</pre></div>
            </details>

            <details>
              <summary>Payments <span class="count" id="paymentsCount">—</span></summary>
              <div class="panel"><pre id="paymentsOut">—</pre></div>
            </details>

            <details>
              <summary>Notifications <span class="count" id="notifsCount">—</span></summary>
              <div class="panel"><pre id="notifsOut">—</pre></div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <script>
      let token = null;
      let lastJson = null;

      const $ = (id) => document.getElementById(id);
      const setError = (msg) => {
        const el = $("error");
        if (!msg) { el.style.display = "none"; el.textContent = ""; return; }
        el.style.display = "block";
        el.textContent = msg;
      };
      const setStatus = (msg) => { $("status").textContent = msg || ""; };

      async function login() {
        setError("");
        setStatus("Logging in…");
        const email = $("email").value.trim();
        const password = $("password").value;
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Login failed");
        token = json.token;
        setStatus("Logged in. Loading logs…");
      }

      function filterItems(items) {
        const p = ($("filterProperty").value || "").trim();
        const a = ($("filterApp").value || "").trim();
        return (items || []).filter((it) => {
          const pid = String(it.property_id || it.propertyId || "");
          const appNo = String(it.application_no || it.applicationNo || "");
          const okP = !p || pid.toLowerCase().includes(p.toLowerCase());
          const okA = !a || appNo.toLowerCase().includes(a.toLowerCase());
          return okP && okA;
        });
      }

      function renderSections(json) {
        const blocks = filterItems(json.blocks);
        const apps = filterItems(json.transferApplications);
        const transfers = filterItems(json.transfers);
        const certs = filterItems(json.certificates);
        const payments = filterItems(json.payments);
        const notifs = filterItems(json.notifications);

        $("rawCount").textContent = "";
        $("blocksCount").textContent = blocks ? blocks.length + " items" : "—";
        $("appsCount").textContent = apps ? apps.length + " items" : "—";
        $("transfersCount").textContent = transfers ? transfers.length + " items" : "—";
        $("certsCount").textContent = certs ? certs.length + " items" : "—";
        $("paymentsCount").textContent = payments ? payments.length + " items" : "—";
        $("notifsCount").textContent = notifs ? notifs.length + " items" : "—";

        $("blocksOut").textContent = JSON.stringify(blocks, null, 2);
        $("appsOut").textContent = JSON.stringify(apps, null, 2);
        $("transfersOut").textContent = JSON.stringify(transfers, null, 2);
        $("certsOut").textContent = JSON.stringify(certs, null, 2);
        $("paymentsOut").textContent = JSON.stringify(payments, null, 2);
        $("notifsOut").textContent = JSON.stringify(notifs, null, 2);
      }

      async function loadLogs() {
        setError("");
        if (!token) throw new Error("Not logged in");
        const limit = $("limit").value;
        const res = await fetch("/api/reports/system-logs?limit=" + encodeURIComponent(limit), {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Failed to load logs");
        lastJson = json;
        $("out").textContent = JSON.stringify(json, null, 2);
        renderSections(json);

        const integrityEl = $("integrity");
        integrityEl.textContent = "Chain integrity: " + String(!!json.chainIntegrity);
        integrityEl.className = "pill " + (json.chainIntegrity ? "ok" : "bad");

        $("stamp").textContent = "Generated: " + new Date(json.generatedAt).toLocaleString();
        $("btnRefresh").disabled = false;
        $("btnCopy").disabled = false;
        setStatus("Loaded.");
      }

      let refreshTimer = null;
      function setAutoRefresh() {
        if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
        const ms = Number($("refresh").value || 0);
        if (ms > 0) {
          refreshTimer = setInterval(() => {
            if (!token) return;
            loadLogs().catch(() => {});
          }, ms);
        }
      }

      $("btnLogin").addEventListener("click", async () => {
        try {
          $("btnLogin").disabled = true;
          await login();
          await loadLogs();
        } catch (e) {
          setError(e.message || String(e));
          setStatus("");
        } finally {
          $("btnLogin").disabled = false;
        }
      });

      $("btnRefresh").addEventListener("click", async () => {
        try {
          $("btnRefresh").disabled = true;
          setStatus("Refreshing…");
          await loadLogs();
        } catch (e) {
          setError(e.message || String(e));
          setStatus("");
        } finally {
          $("btnRefresh").disabled = false;
        }
      });

      $("btnCopy").addEventListener("click", async () => {
        try {
          if (!lastJson) return;
          await navigator.clipboard.writeText(JSON.stringify(lastJson, null, 2));
          setStatus("Copied to clipboard.");
          setTimeout(() => setStatus(""), 1200);
        } catch {
          setStatus("Copy failed (browser blocked clipboard).");
        }
      });

      ["filterProperty", "filterApp"].forEach((id) => {
        $(id).addEventListener("input", () => {
          if (!lastJson) return;
          renderSections(lastJson);
        });
      });

      $("refresh").addEventListener("change", () => {
        setAutoRefresh();
      });
    </script>
  </body>
</html>`);
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/public/grievances', grievancesRouter);

// Protected routes below this line
app.use('/api', authMiddleware);
app.use('/api/users', userRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/grievances', grievancesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/certificates', certificatesRouter);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = { app };

