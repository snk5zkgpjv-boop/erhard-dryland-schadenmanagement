import {createHash,timingSafeEqual} from "crypto";
import {getSql} from "@/lib/db";
import {audit,ensureOrganizationSchema} from "@/lib/organization";

export const runtime="nodejs";
function validToken(request:Request){
  const expected=process.env.ORGANIZATION_SYNC_TOKEN||"",actual=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!expected||!actual)return false;return timingSafeEqual(createHash("sha256").update(expected).digest(),createHash("sha256").update(actual).digest());
}
export async function POST(request:Request){
  if(!validToken(request))return Response.json({error:"Ungültiger Synchronisationsschlüssel."},{status:401});
  try{
    await ensureOrganizationSchema();const body=await request.json(),entries=Array.isArray(body.entries)?body.entries:[];const sql=getSql();
    const users=await sql`SELECT id FROM app_users WHERE role='admin' AND active=true ORDER BY created_at LIMIT 1`;if(!users.length)return Response.json({error:"Kein Administrator eingerichtet."},{status:503});const ownerId=String(users[0].id);let synced=0;
    for(const e of entries.slice(0,1000)){
      if(!e?.id||!e?.start)continue;
      const rows=await sql`INSERT INTO org_time_entries(owner_id,source,area,activity,location,notes,started_at,ended_at,volunteer,sunday,external_id)
        VALUES(${ownerId},'ecg','ecg',${String(e.workLabel||"ECG Hausmeistertätigkeit")},${String(e.workLabel||"")||null},${String(e.note||"")||null},${e.start},${e.end||null},${!!e.volunteer},${new Date(e.start).getDay()===0},${String(e.id)})
        ON CONFLICT(owner_id,source,external_id) WHERE external_id IS NOT NULL DO UPDATE SET activity=excluded.activity,location=excluded.location,notes=excluded.notes,started_at=excluded.started_at,ended_at=excluded.ended_at,volunteer=excluded.volunteer,sunday=excluded.sunday,deleted_at=NULL,updated_at=now() RETURNING *`;
      if(rows.length){synced++;await audit(ownerId,"time",String(rows[0].id),"ecg_sync",rows[0])}
    }
    return Response.json({ok:true,synced});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"ECG-Synchronisierung fehlgeschlagen."},{status:500})}
}
