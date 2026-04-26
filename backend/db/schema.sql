-- CertChain: users, institutions, issued certificate metadata (Postgres 15+)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'institution')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  website VARCHAR(500),
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  logo_filename VARCHAR(255),
  signature_filename VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  cert_id UUID NOT NULL,
  qr_token VARCHAR(64) NOT NULL UNIQUE,
  hcs_sequence_number VARCHAR(50) NOT NULL,
  topic_id VARCHAR(50) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  institution_name_snapshot VARCHAR(500) NOT NULL,
  recipient_name VARCHAR(500) NOT NULL,
  course_name VARCHAR(500) NOT NULL,
  course_description TEXT,
  issue_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issued_certs_qr ON issued_certificates (qr_token);
CREATE INDEX IF NOT EXISTS idx_issued_certs_seq ON issued_certificates (hcs_sequence_number);
CREATE INDEX IF NOT EXISTS idx_issued_certs_inst ON issued_certificates (institution_id);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions (status);
