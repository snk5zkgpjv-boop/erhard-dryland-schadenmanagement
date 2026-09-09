import {createCipheriv,createDecipheriv,createHash,randomBytes} from "crypto";
import {getSql} from "@/lib/db";

let schemaReady:Promise<void>|null=null;

export function ensureOrganizationSchema(){
  if(!schemaReady)schemaReady=createOrganizationSchema().catch(error=>{schemaReady=null;throw error});
  return schemaReady;
}

async function createOrganizationSchema(){
  const sql=getSql();
  await sql`CREATE TABLE IF NOT EXISTS org_time_entries(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    source text NOT NULL DEFAULT 'organization', area text NOT NULL DEFAULT 'erhard', activity text NOT NULL,
    customer text, location text, notes text, started_at timestamptz NOT NULL, ended_at timestamptz,
    travel_minutes integer NOT NULL DEFAULT 0, billable boolean NOT NULL DEFAULT false,
    volunteer boolean NOT NULL DEFAULT false, sunday boolean NOT NULL DEFAULT false,
    external_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS org_time_source_external_uq ON org_time_entries(owner_id,source,external_id) WHERE external_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS org_time_owner_started_idx ON org_time_entries(owner_id,started_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS org_schedule_entries(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    category text NOT NULL DEFAULT 'appointment', title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz,
    location text, notes text, protected boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`CREATE INDEX IF NOT EXISTS org_schedule_owner_starts_idx ON org_schedule_entries(owner_id,starts_at)`;
  await sql`CREATE TABLE IF NOT EXISTS org_finance_entries(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    entry_date date NOT NULL DEFAULT current_date, kind text NOT NULL CHECK(kind IN ('income','expense')),
    scope text NOT NULL DEFAULT 'private', category text NOT NULL, description text NOT NULL,
    amount_cents bigint NOT NULL, recurring boolean NOT NULL DEFAULT false, interval_months integer,
    notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`CREATE TABLE IF NOT EXISTS org_reserves(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name text NOT NULL, scope text NOT NULL DEFAULT 'private', target_cents bigint NOT NULL,
    saved_cents bigint NOT NULL DEFAULT 0, due_date date, interval_months integer NOT NULL DEFAULT 12,
    notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`CREATE TABLE IF NOT EXISTS org_family_members(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name text NOT NULL, member_role text NOT NULL DEFAULT 'child', monthly_allowance_cents bigint NOT NULL DEFAULT 0,
    access_level text NOT NULL DEFAULT 'own' CHECK(access_level IN ('admin','family','own','none')),
    notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`CREATE TABLE IF NOT EXISTS org_mail_accounts(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    label text NOT NULL, email text NOT NULL, provider text NOT NULL, connection_type text NOT NULL DEFAULT 'imap',
    host text, port integer, security text, encrypted_secret text, sync_enabled boolean NOT NULL DEFAULT false,
    last_sync_at timestamptz, status text NOT NULL DEFAULT 'setup_required', notes text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`ALTER TABLE org_mail_accounts ADD COLUMN IF NOT EXISTS encrypted_secret text`;
  await sql`CREATE TABLE IF NOT EXISTS org_mail_items(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES org_mail_accounts(id) ON DELETE CASCADE, external_id text NOT NULL,
    sender text, subject text NOT NULL, received_at timestamptz, preview text, relevance text NOT NULL DEFAULT 'normal',
    suggested_action text, suggested_start timestamptz, processed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(account_id,external_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS org_documents(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    document_type text NOT NULL DEFAULT 'other', title text NOT NULL, issuer text, policy_number text,
    amount_cents bigint, due_date date, interval_months integer, extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'confirmed', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
  )`;
  await sql`CREATE TABLE IF NOT EXISTS org_settings(
    owner_id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    ecg_weekly_target_minutes integer NOT NULL DEFAULT 660, ecg_presence_credit_minutes integer NOT NULL DEFAULT 180,
    home_location text NOT NULL DEFAULT 'Hussenhofen', work_location text NOT NULL DEFAULT 'Oberkochen',
    commute_km numeric(8,2) NOT NULL DEFAULT 32, commute_minutes integer NOT NULL DEFAULT 25,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS org_audit_log(
    id bigserial PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    entity text NOT NULL, entity_id text NOT NULL, action text NOT NULL, snapshot jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
}

export function requestOwnerId(request:Request){
  const role=request.headers.get("x-app-role");
  const id=request.headers.get("x-app-user-id");
  if(role!=="admin"||!id)throw new Error("FORBIDDEN");
  return id;
}

export async function audit(ownerId:string,entity:string,entityId:string,action:string,snapshot:unknown){
  const sql=getSql();
  await sql`INSERT INTO org_audit_log(owner_id,entity,entity_id,action,snapshot) VALUES(${ownerId},${entity},${entityId},${action},${JSON.stringify(snapshot)}::jsonb)`;
}

export function cents(value:unknown){
  const n=Number(value);
  if(!Number.isFinite(n))return 0;
  return Math.round(n*100);
}

function encryptionKey(){const secret=process.env.ORGANIZATION_ENCRYPTION_KEY;if(!secret)throw new Error("ORGANIZATION_ENCRYPTION_KEY ist nicht konfiguriert.");return createHash("sha256").update(secret).digest()}
export function encryptSecret(value:string){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv),encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".")}
export function decryptSecret(value:string){const[iv,tag,data]=value.split(".");const decipher=createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(iv,"base64url"));decipher.setAuthTag(Buffer.from(tag,"base64url"));return Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8")}
