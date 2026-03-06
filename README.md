# BhoomiChain – Permissioned Blockchain Land Registry MVP

## Overview

BhoomiChain is a **permissioned, blockchain-inspired land registry** that demonstrates how on-chain validation, role-based access control, and fraud analytics can reduce land scams.

The MVP uses:

- **Backend**: Node.js, Express, PostgreSQL, JWT auth, RBAC middleware
- **Blockchain layer**: Simulated hash-chained `blocks` table with integrity verification
- **Smart-contract logic** in backend routes for:
  - Land registration
  - Ownership transfer (with mortgage / litigation / dispute checks)
  - Mortgage lock / unlock (Bank)
  - Litigation freeze / unfreeze (Court)
- **Risk & fraud engine**: rule-based scoring and anomaly flags
- **Frontend**: Next.js + React, Tailwind CSS, Leaflet map, QR-based public verification

This is designed for **hackathon demos**: easy to run locally, visually clear, and focused on core flows.

## Folder structure

- `backend/`
  - `src/app.js` – Express app wiring, routes, middleware
  - `src/server.js` – entrypoint
  - `src/db/` – PostgreSQL connection + schema + migration script
  - `src/blockchain/blockchain.js` – hash-chained blocks, integrity check
  - `src/routes/` – `auth`, `user`, `property`, `public` APIs
  - `src/services/` – risk scoring, fraud detection, IPFS hash validation
- `frontend/`
  - `pages/` – landing, login, role dashboard, public verify
  - `components/` – shared `Layout`, `MapView`
  - `styles.css` + Tailwind config

## Backend – Setup & Run

### 1. Requirements

- Node.js 18+
- PostgreSQL 13+

### 2. Configure database

Create a database, for example:

```sql
CREATE DATABASE bhoomichain;
```

### 3. Environment variables

In `backend/.env`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bhoomichain
JWT_SECRET=super-secret-development-key
```

Adjust `DATABASE_URL` to match your local PostgreSQL credentials.

### 4. Install & migrate

```bash
cd backend
npm install
npm run db:migrate
npm start
```

Backend will listen on `http://localhost:4000`.

### 5. Seed demo users

Use a REST client (or curl):

```bash
POST http://localhost:4000/api/auth/seed-demo-users
```

Creates:

- Citizen: `alice@citizen.test` / `password`
- Registrar: `bob@registrar.test` / `password`
- Bank: `bank@bank.test` / `password`
- Court: `court@court.test` / `password`

## Frontend – Setup & Run

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Run dev server:

```bash
npm run dev
```

Frontend will be at `http://localhost:3000`.

## Key Screens

- `/` – **Landing page**
  - Explains roles and links to:
    - Stakeholder login
    - Public verification portal
- `/login` – **Stakeholder login**
  - Uses seeded demo users
- `/dashboard` – **Role-based dashboard**
  - **Citizen**:
    - View owned properties, risk score badge
    - See mortgage/litigation/disputed flags
    - Map visualization of geo-coordinates
  - **Registrar**:
    - Register demo properties for citizens
    - Trigger demo ownership transfers (honours smart-contract rules)
  - **Bank**:
    - Lock / release mortgage on a property
  - **Court**:
    - Freeze / unfreeze property under litigation
- `/verify` – **Public verification portal**
  - Enter **Property ID** or **Transaction ID**
  - Shows:
    - Current mortgage & litigation status
    - Risk score & dispute flag (via property endpoint)
    - Full blockchain audit trail for that property
    - Chain integrity result (valid / tampered)
    - Leaflet map of property location
    - QR code pointing to the verification API URL

## Demo Script (Live Walkthrough)

Use these steps during your pitch:

1. **Registrar registers property**
   - Login as Registrar (`bob@registrar.test`).
   - On `Registrar` dashboard, click **“Register Demo Property”**.
   - A new property is created for Alice (citizen) with:
     - Property ID like `PROP-12345`
     - Coordinates (e.g. Bangalore)
     - IPFS document hash stored on-chain and in DB.
   - Show in the right panel:
     - Blockchain timeline with `LAND_REGISTER` block.

2. **Bank applies mortgage lock**
   - Login as Bank (`bank@bank.test`).
   - Paste the Property ID into the **Bank Mortgage Controls**.
   - Click **“Lock Mortgage”**.
   - Observe:
     - New `MORTGAGE_LOCK` block in audit trail (via dashboard or `/verify`).
     - Property’s mortgage status becomes `ACTIVE`.

3. **Attempt transfer while mortgage is active → FAIL**
   - Login as Registrar.
   - Ensure the same Property ID is selected in the audit panel.
   - Click **“Execute Transfer (demo logic)”**.
   - Backend enforces rules:
     - Transfer is **rejected** with message `Transfer blocked: active mortgage`.

4. **Bank releases mortgage**
   - Login as Bank.
   - Click **“Release Mortgage”**.
   - Audit trail updates with `MORTGAGE_RELEASE` block.
   - Property status shows `mortgage_status = NONE`.

5. **Court freezes property (litigation)**
   - Login as Court (`court@court.test`).
   - Enter the same Property ID in **Court Litigation Controls**.
   - Click **“Freeze Property”**.
   - Backend:
     - Sets `litigation_status = ACTIVE` with `CASE-2026-DEMO`.
     - Appends `LITIGATION_FREEZE` block to chain.

6. **Attempt transfer while litigation active → FAIL**
   - Login as Registrar.
   - Attempt **“Execute Transfer (demo logic)”** again.
   - Transfer is **rejected** with message `Transfer blocked: active litigation`.

7. **Court unfreezes property**
   - Login as Court.
   - Click **“Unfreeze Property”**.
   - `LITIGATION_UNFREEZE` block is added; status returns to `NONE`.

8. **Transfer succeeds**
   - Login as Registrar.
   - Click **“Execute Transfer (demo logic)”** again.
   - Now transfer **succeeds**:
     - `TRANSFER` block added to chain.
     - `transfers` table records seller/buyer.
     - Risk score updated (e.g. additional points for recent transfers).

9. **Public verifies via QR**
   - Go to `/verify`.
   - Enter the **Property ID** from the demo.
   - Show:
     - Ownership / status
     - Audit trail with all blocks from registration to latest transfer
     - Chain integrity indicator (valid)
   - Display the generated **QR code**:
     - Explain that anyone can scan it to hit the verification API endpoint and re-check the same data.

## Security & Integrity Highlights

- **JWT Authentication & RBAC**
  - All protected endpoints require a valid JWT.
  - Role checks:
    - Registrar-only: registration, transfer
    - Bank-only: mortgage lock / release
    - Court-only: litigation freeze / unfreeze

- **Simulated Blockchain**
  - Each block contains:
    - `prev_hash`, `hash`, `tx_type`, `property_id`, `payload`, `created_by_user_id`, timestamp.
  - `verifyChainIntegrity()` recomputes hashes over the chain and ensures linking is intact.
  - Public endpoints expose this integrity result.

- **Risk Scoring & Fraud Detection**
  - Risk score increments for:
    - Active mortgage (+30)
    - Active litigation (+40)
    - Multiple transfers in last year (+15)
    - Frequent historical flips (+10)
  - Fraud rules:
    - Repeated transfers of same property in short time window
    - Same seller offloading many properties quickly
    - Rapid flips on one property
  - Suspicious events mark `disputed = TRUE` on the property.

- **IPFS Hash Handling**
  - Backend validates document hash format on registration.
  - Only **hash** is stored on-chain; actual documents are expected to live in IPFS / pinning service.

## Notes & Extensions

Possible future enhancements:

- Aadhaar-style KYC simulation for citizens
- Real IPFS client integration for document upload
- More advanced anomaly detection (ML-based scoring)
- Escrow-based payment contracts and conditional transfer finalization
- Multi-language support in the React UI

