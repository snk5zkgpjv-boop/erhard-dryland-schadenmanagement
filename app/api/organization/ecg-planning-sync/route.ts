import {createHash,timingSafeEqual} from "crypto";
import {getSql} from "@/lib/db";
import {ensureOrganizationSchema} from "@/lib/organization";

export const runtime="nodejs";
function validToken(request:Request){const expected=process.env.ORGANIZATION_SYNC_TOKEN||"",actual=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");if(!expected||!actual)return false;return timingSafeEqual(createHash("sha256").update(expected).digest(),createHash("sha256").update(actual).digest())}
export async function POST(request:Request){
 if(!validToken(request))return Response.json({error:"Ungültiger Synchronisationsschlüssel."},{status:401});
 try{
  await ensureOrganizationSchema();const body=await request.json(),ownerEmail=String(body.ownerEmail||"").trim().toLowerCase(),p=body.plan||{};
  if(!ownerEmail||!p.issueId)return Response.json({error:"Eigentümer oder Hinweis-ID fehlt."},{status:400});
  const sql=getSql();const users=await sql`SELECT id FROM app_users WHERE active=true AND lower(email)=${ownerEmail} LIMIT 1`;
  if(!users.length)return Response.json({error:"Kein passendes Organisationskonto gefunden."},{status:404});const ownerId=String(users[0].id);
  const estimated=p.estimatedMinutes==null?null:Number(p.estimatedMinutes);
  await sql`INSERT INTO org_ecg_issue_plans(owner_id,external_id,title,location,issue_priority,issue_status,estimated_minutes,planning_priority,notes,blocked,source_updated_at)
   VALUES(${ownerId},${String(p.issueId)},${String(p.title||"ECG Hinweis").slice(0,500)},${String(p.location||"")||null},${String(p.issuePriority||"normal")},${String(p.issueStatus||"open")},${estimated},${String(p.planningPriority||"normal")},${String(p.note||"")||null},${!!p.blocked},${p.updatedAt||null})
   ON CONFLICT(owner_id,external_id) DO UPDATE SET title=excluded.title,location=excluded.location,issue_priority=excluded.issue_priority,issue_status=excluded.issue_status,estimated_minutes=excluded.estimated_minutes,planning_priority=excluded.planning_priority,notes=excluded.notes,blocked=excluded.blocked,source_updated_at=excluded.source_updated_at,updated_at=now()`;
  return Response.json({ok:true});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"ECG-Planung konnte nicht synchronisiert werden."},{status:500})}
}
