-- BhoomiChain database schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CITIZEN', 'REGISTRAR', 'BANK', 'COURT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY,
  property_id TEXT UNIQUE NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  geo_coordinates TEXT NOT NULL,
  ipfs_hash TEXT,
  mortgage_status TEXT NOT NULL DEFAULT 'NONE' CHECK (mortgage_status IN ('NONE', 'ACTIVE')),
  litigation_status TEXT NOT NULL DEFAULT 'NONE' CHECK (litigation_status IN ('NONE', 'ACTIVE')),
  disputed BOOLEAN NOT NULL DEFAULT FALSE,
  risk_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY,
  height BIGSERIAL,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  tx_type TEXT NOT NULL,
  property_id TEXT,
  payload JSONB NOT NULL,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_property_id ON blocks(property_id);

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY,
  property_id TEXT NOT NULL,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  tx_block_id UUID NOT NULL REFERENCES blocks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mortgages (
  id UUID PRIMARY KEY,
  property_id TEXT NOT NULL,
  bank_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RELEASED')),
  tx_block_id UUID NOT NULL REFERENCES blocks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS litigations (
  id UUID PRIMARY KEY,
  property_id TEXT NOT NULL,
  court_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CLOSED')),
  case_reference TEXT NOT NULL,
  tx_block_id UUID NOT NULL REFERENCES blocks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Demo "real system" workflow tables

CREATE TABLE IF NOT EXISTS transfer_applications (
  id UUID PRIMARY KEY,
  application_no TEXT UNIQUE NOT NULL,
  property_id TEXT NOT NULL REFERENCES properties(property_id),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
  citizen_note TEXT,
  registrar_note TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  reviewed_by_user_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transfer_applications_property_id ON transfer_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_transfer_applications_status ON transfer_applications(status);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  reference TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PAID', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY,
  grievance_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by_user_id UUID REFERENCES users(id),
  resolution_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY,
  certificate_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TRANSFER_APPROVAL')),
  property_id TEXT NOT NULL REFERENCES properties(property_id),
  application_id UUID REFERENCES transfer_applications(id),
  issued_to_user_id UUID NOT NULL REFERENCES users(id),
  issued_by_user_id UUID NOT NULL REFERENCES users(id),
  payload JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_to ON certificates(issued_to_user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_property_id ON certificates(property_id);

