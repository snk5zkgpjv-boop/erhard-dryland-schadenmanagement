import {createHash,randomBytes,scryptSync,timingSafeEqual} from "crypto";
import {cookies,headers} from "next/headers";
import {redirect} from "next/navigation";
import {getSql} from "@/lib/db";

export type AppRole="admin"|"techniker"|"buero";
export type AppUser={id:string;username:string;display_name:string;email:string|null;role:AppRole;active:boolean};

export async function ensureAuthSchema(){
  const sql=getSql();
  await sql`CREATE TABLE IF NOT EXISTS app_users(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL,
    display_name text NOT NULL,
    email text,
    role text NOT NULL DEFAULT 'techniker' CHECK (role IN ('admin','techniker','buero')),
    password_hash text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_lower_uq ON app_users((lower(username)))`;
  await sql`CREATE TABLE IF NOT EXISTS app_sessions(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS app_sessions_expires_idx ON app_sessions(expires_at)`;
}

export function hashPassword(password:string){
  const salt=randomBytes(16).toString("hex");
  const digest=scryptSync(password,salt,64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}
export function verifyPassword(password:string,stored:string){
  const [alg,salt,digest]=stored.split("$");
  if(alg!=="scrypt"||!salt||!digest)return false;
  const actual=scryptSync(password,salt,64);
  const expected=Buffer.from(digest,"hex");
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function sessionHash(token:string){return createHash("sha256").update(token).digest("hex")}

export async function createSession(userId:string){
  await ensureAuthSchema();
  const token=randomBytes(32).toString("base64url");
  const hash=sessionHash(token);
  const sql=getSql();
  await sql`INSERT INTO app_sessions(user_id,token_hash,expires_at) VALUES(${userId},${hash},now()+interval '30 days')`;
  const jar=await cookies();
  jar.set("schaden_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
}
export async function clearSession(){
  const jar=await cookies();
  const token=jar.get("schaden_session")?.value;
  if(token){
    const sql=getSql();
    await sql`DELETE FROM app_sessions WHERE token_hash=${sessionHash(token)}`.catch(()=>{});
  }
  jar.set("schaden_session","",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
}
export async function currentUser():Promise<AppUser|null>{
  try{
    await ensureAuthSchema();
    const jar=await cookies();const token=jar.get("schaden_session")?.value;if(!token)return null;
    const sql=getSql();
    const rows=await sql`SELECT u.id,u.username,u.display_name,u.email,u.role,u.active
      FROM app_sessions s JOIN app_users u ON u.id=s.user_id
      WHERE s.token_hash=${sessionHash(token)} AND s.expires_at>now() AND u.active=true LIMIT 1`;
    return rows.length?rows[0] as AppUser:null;
  }catch{return null}
}
export async function requirePageUser(roles?:AppRole[]){
  const user=await currentUser();
  if(!user)redirect("/login");
  if(roles&&!roles.includes(user.role))redirect("/");
  return user;
}
export async function roleFromRequestHeaders():Promise<AppRole|null>{
  const h=await headers();const r=h.get("x-app-role");
  return r==="admin"||r==="techniker"||r==="buero"?r:null;
}
