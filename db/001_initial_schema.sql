CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  tax_number text,
  vat_id text,
  iban text,
  bic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  street text,
  postal_code text,
  city text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS damage_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  customer_id uuid REFERENCES customers(id),
  project_number text,
  damage_number text,
  insurance_number text,
  insurer text,
  object_name text,
  object_street text,
  object_postal_code text,
  object_city text,
  damage_cause text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  category text NOT NULL,
  room text,
  component text,
  caption text,
  storage_key text,
  taken_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  room text,
  component text,
  device text,
  method text,
  value numeric,
  unit text,
  note text,
  measured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_storage_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id),
  work_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  customer_signature_storage_key text,
  employee_signature_storage_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_report_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_report_id uuid NOT NULL REFERENCES work_reports(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  description text NOT NULL,
  quantity numeric,
  unit text
);

CREATE TABLE IF NOT EXISTS drying_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  device_type text NOT NULL,
  inventory_number text,
  serial_number text,
  location text,
  installed_at timestamptz,
  removed_at timestamptz
);

CREATE TABLE IF NOT EXISTS energy_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  unit_name text,
  start_date date,
  end_date date,
  meter_start numeric,
  meter_end numeric,
  consumption_kwh numeric,
  price_per_kwh numeric,
  meter_start_photo_key text,
  meter_end_photo_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  article_number text,
  category text,
  title text NOT NULL,
  description text,
  unit text,
  unit_price numeric(12,2),
  vat_rate numeric(5,2) DEFAULT 19.00,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_case_id uuid NOT NULL REFERENCES damage_cases(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id),
  document_type text NOT NULL,
  document_number text,
  status text NOT NULL DEFAULT 'draft',
  document_date date NOT NULL DEFAULT current_date,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  net_total numeric(12,2),
  tax_total numeric(12,2),
  gross_total numeric(12,2),
  pdf_storage_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position_no text,
  article_id uuid REFERENCES articles(id),
  description text NOT NULL,
  quantity numeric,
  unit text,
  unit_price numeric(12,2),
  total_price numeric(12,2)
);

INSERT INTO companies (code, name)
VALUES
  ('ERHARD', 'Erhard Dienstleistungen'),
  ('DRYLAND', 'Dryland Trocknungstechnik')
ON CONFLICT (code) DO NOTHING;
