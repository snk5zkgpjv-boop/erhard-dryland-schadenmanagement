import {createHash,timingSafeEqual} from "crypto";
import {getSql} from "@/lib/db";
import {audit,ensureOrganizationSchema} from "@/lib/organization";

export const runtime="nodejs";
function authorized(request:Request){
  const configured=process.env.ORGANIZATION_VOICE_TOKEN||"",supplied=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!configured||!supplied)return false;const a=createHash("sha256").update(configured).digest(),b=createHash("sha256").update(supplied).digest();return timingSafeEqual(a,b);
}
function parseSpeech(text:string){
  const lower=text.toLowerCase();const stop=/\b(fertig|beendet|ende|stop|gestoppt)\b/.test(lower),start=/\b(start|beginne|angefangen|losgefahren|fahre los)\b/.test(lower);
  let area="erhard";if(/\becg|kirche|hausmeister/.test(lower))area="ecg";else if(/\bzeiss|oberkochen|schicht/.test(lower))area="zeiss";else if(/\bfamil/.test(lower))area="family";else if(/\bdryland|trocknung/.test(lower))area="dryland";
  const customer=/massimo|san remo|sgroia/i.test(text)?"Pizzeria San Remo · Massimo Sgroia":null;
  return {action:stop?"stop":start?"start":"entry",area,activity:text.trim(),customer};
}
export async function POST(request:Request){
  if(!authorized(request))return Response.json({error:"Ungültiger Shortcut-Schlüssel."},{status:401});
  try{
    await ensureOrganizationSchema();const body=await request.json(),speech=String(body.text||body.transcript||"").trim();if(!speech)return Response.json({error:"Kein gesprochener Text empfangen."},{status:400});
    const sql=getSql();const owners=await sql`SELECT id FROM app_users WHERE role='admin' AND active=true ORDER BY created_at LIMIT 1`;if(!owners.length)return Response.json({error:"Kein Administrator eingerichtet."},{status:503});const ownerId=String(owners[0].id),parsed=parseSpeech(speech);
    if(parsed.action==="stop"){
      const rows=await sql`UPDATE org_time_entries SET ended_at=now(),notes=concat_ws(E'\n',notes,${speech}),updated_at=now() WHERE id=(SELECT id FROM org_time_entries WHERE owner_id=${ownerId} AND ended_at IS NULL AND deleted_at IS NULL ORDER BY started_at DESC LIMIT 1) RETURNING *`;
      if(!rows.length)return Response.json({ok:false,message:"Es läuft keine Zeiterfassung."},{status:409});await audit(ownerId,"time",String(rows[0].id),"voice_stop",rows[0]);return Response.json({ok:true,message:`Zeiterfassung beendet: ${rows[0].activity}`,entry:rows[0]});
    }
    const rows=await sql`INSERT INTO org_time_entries(owner_id,source,area,activity,customer,started_at,ended_at,notes,billable,sunday) VALUES(${ownerId},'iphone_shortcut',${parsed.area},${parsed.activity},${parsed.customer},now(),${parsed.action==="start"?null:new Date().toISOString()},${speech},${parsed.area==="erhard"||parsed.area==="dryland"},${new Date().getDay()===0}) RETURNING *`;
    await audit(ownerId,"time",String(rows[0].id),"voice_create",rows[0]);return Response.json({ok:true,message:parsed.action==="start"?"Zeiterfassung gestartet.":"Spracheintrag gespeichert. Bitte Dauer bei Bedarf ergänzen.",entry:rows[0]});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Spracheintrag fehlgeschlagen."},{status:500})}
}
