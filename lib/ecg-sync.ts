import {getSql} from "@/lib/db";
import {audit,ensureOrganizationSchema} from "@/lib/organization";
import {uniqueEcgOwner,validEcgEntries} from "@/lib/ecg-contract";

export async function resolveEcgOwner(ownerEmail:string,entries:any[]){
 const sql=getSql();
 const exact=await sql`SELECT id FROM app_users WHERE active=true AND lower(trim(email))=${ownerEmail}`;
 const ids=entries.map(e=>String(e.id));
 const historical=await sql`SELECT DISTINCT u.id FROM app_users u JOIN org_time_entries t ON t.owner_id=u.id WHERE u.active=true AND t.source='ecg' AND t.external_id=ANY(${ids}::text[])`;
 const id=uniqueEcgOwner(exact,historical);
 if(!id)throw new Error("Kein eindeutiges Organisationskonto zur ECG-Verknüpfung gefunden.");
 return id;
}
export async function importEcgTimes(ownerId:string,raw:unknown){
 const entries=validEcgEntries(raw),sql=getSql();let changed=0;
 for(const e of entries){
  const sunday=new Intl.DateTimeFormat("en-US",{timeZone:"Europe/Berlin",weekday:"short"}).format(new Date(e.start))==="Sun";
  const rows=await sql`INSERT INTO org_time_entries(owner_id,source,area,activity,location,notes,started_at,ended_at,volunteer,sunday,external_id)
  VALUES(${ownerId},'ecg','ecg',${String(e.workLabel||"ECG Hausmeistertätigkeit")},${String(e.workLabel||"")||null},${String(e.note||"")||null},${e.start},${e.end},${!!e.volunteer},${sunday},${String(e.id)})
  ON CONFLICT(owner_id,source,external_id) WHERE external_id IS NOT NULL DO UPDATE SET activity=excluded.activity,location=excluded.location,notes=excluded.notes,started_at=excluded.started_at,ended_at=excluded.ended_at,volunteer=excluded.volunteer,sunday=excluded.sunday,deleted_at=NULL,updated_at=now()
  WHERE (org_time_entries.activity,org_time_entries.location,org_time_entries.notes,org_time_entries.started_at,org_time_entries.ended_at,org_time_entries.volunteer,org_time_entries.sunday,org_time_entries.deleted_at)
  IS DISTINCT FROM (excluded.activity,excluded.location,excluded.notes,excluded.started_at,excluded.ended_at,excluded.volunteer,excluded.sunday,NULL::timestamptz)
  RETURNING *`;
  if(rows.length){changed++;await audit(ownerId,"time",String(rows[0].id),"ecg_sync",rows[0]);}
 }
 const ids=entries.map(e=>String(e.id));
 const stored=await sql`SELECT external_id,activity,location,notes,started_at,ended_at,volunteer FROM org_time_entries WHERE owner_id=${ownerId} AND source='ecg' AND deleted_at IS NULL AND external_id=ANY(${ids}::text[])`;
 const byId=new Map(stored.map(r=>[String(r.external_id),r]));
 for(const e of entries){
  const r=byId.get(String(e.id));
  if(!r||Date.parse(r.started_at)!==Date.parse(e.start)||Date.parse(r.ended_at)!==Date.parse(e.end)||r.activity!==String(e.workLabel||"ECG Hausmeistertätigkeit")||r.notes!==(String(e.note||"")||null)||r.volunteer!==!!e.volunteer)throw new Error("ECG-Nachübertragung konnte nicht vollständig bestätigt werden.");
 }
 return {synced:entries.length,changed,verified:entries.length};
}
type Result={status:string;count?:number;changed?:number;verified?:number;checkedAt?:string;error?:string};
const pending=new Map<string,Promise<Result>>();
export function refreshEcgTimes(ownerId:string):Promise<Result>{
 const current=pending.get(ownerId);if(current)return current;
 const task=refresh(ownerId).finally(()=>pending.delete(ownerId));pending.set(ownerId,task);return task;
}
export async function reconcileLinkedEcgTimes():Promise<Result>{return refresh();}
async function refresh(ownerId?:string):Promise<Result>{
 try{
  const token=process.env.ORGANIZATION_SYNC_TOKEN;
  const origin=process.env.ECG_API_URL;
  if(!token||!origin)return {status:"not_configured",error:"ECG-Abgleich ist nicht eingerichtet."};
  const url=new URL("/api/state?organizationExport=1",origin);
  if(url.protocol!=="https:")throw new Error("Ungültige ECG-Adresse.");
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`},cache:"no-store",signal:AbortSignal.timeout(15000),redirect:"error"});
  if(!response.ok)throw new Error(`ECG-Abfrage fehlgeschlagen (HTTP ${response.status}).`);
  const body=await response.json();
  if(body.ok!==true||typeof body.ownerEmail!=="string")throw new Error("Ungültige ECG-Antwort.");
  const entries=validEcgEntries(body.entries);
  await ensureOrganizationSchema();
  const linkedOwner=await resolveEcgOwner(body.ownerEmail.trim().toLowerCase(),entries);
  if(ownerId&&linkedOwner!==ownerId)return {status:"not_applicable"};
  const result=await importEcgTimes(linkedOwner,entries);
  return {status:"synced",count:result.synced,changed:result.changed,verified:result.verified,checkedAt:new Date().toISOString()};
 }catch(error){return {status:"pending",error:error instanceof Error?error.message:"ECG-Abgleich fehlgeschlagen."};}
}
