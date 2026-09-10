import {createHash,randomBytes} from "crypto";
import {getSql} from "@/lib/db";
import {ensureAuthSchema} from "@/lib/auth";

let schemaReady:Promise<void>|null=null;
export function tokenHash(value:string){return createHash("sha256").update(value).digest("hex")}
export function randomToken(bytes=32){return randomBytes(bytes).toString("base64url")}
export function ensureMcpAuthSchema(){if(!schemaReady)schemaReady=createSchema().catch(error=>{schemaReady=null;throw error});return schemaReady}
async function createSchema(){
  await ensureAuthSchema();const sql=getSql();
  await sql`CREATE TABLE IF NOT EXISTS mcp_oauth_clients(client_id text PRIMARY KEY,client_name text NOT NULL DEFAULT 'ChatGPT',redirect_uris jsonb NOT NULL,grant_types jsonb NOT NULL DEFAULT '["authorization_code","refresh_token"]'::jsonb,response_types jsonb NOT NULL DEFAULT '["code"]'::jsonb,token_endpoint_auth_method text NOT NULL DEFAULT 'none',created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS mcp_oauth_codes(code_hash text PRIMARY KEY,client_id text NOT NULL REFERENCES mcp_oauth_clients(client_id) ON DELETE CASCADE,owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,redirect_uri text NOT NULL,code_challenge text NOT NULL,expires_at timestamptz NOT NULL,used_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS mcp_oauth_tokens(access_token_hash text PRIMARY KEY,refresh_token_hash text UNIQUE NOT NULL,client_id text NOT NULL REFERENCES mcp_oauth_clients(client_id) ON DELETE CASCADE,owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,access_expires_at timestamptz NOT NULL,refresh_expires_at timestamptz NOT NULL,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS mcp_oauth_tokens_owner_idx ON mcp_oauth_tokens(owner_id)`;
}
export async function mcpOwnerFromRequest(request:Request){
  await ensureMcpAuthSchema();const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");if(!token)return null;
  const sql=getSql(),rows=await sql`SELECT t.owner_id FROM mcp_oauth_tokens t JOIN app_users u ON u.id=t.owner_id WHERE t.access_token_hash=${tokenHash(token)} AND t.access_expires_at>now() AND t.revoked_at IS NULL AND u.active=true LIMIT 1`;
  return rows.length?String(rows[0].owner_id):null;
}
export function pkceChallenge(verifier:string){return createHash("sha256").update(verifier).digest("base64url")}
