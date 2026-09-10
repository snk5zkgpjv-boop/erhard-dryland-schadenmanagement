import {getSql} from "@/lib/db";
import {audit,cents,encryptSecret,ensureOrganizationSchema,requestOwnerId} from "@/lib/organization";

export const runtime="nodejs";
const validEntities=new Set(["time","schedule","finance","reserves","family","mail","documents"]);

function errorResponse(error:unknown){
  if(error instanceof Error&&error.message==="FORBIDDEN")return Response.json({error:"Dieser Bereich ist nur für den Administrator freigegeben."},{status:403});
  return Response.json({error:error instanceof Error?error.message:"Die Daten konnten nicht verarbeitet werden."},{status:500});
}

export async function GET(request:Request){
  try{
    const ownerId=requestOwnerId(request);await ensureOrganizationSchema();
    const url=new URL(request.url),entity=url.searchParams.get("entity")||"time",trash=url.searchParams.get("trash")==="1";
    if(!validEntities.has(entity))return Response.json({error:"Unbekannter Datenbereich."},{status:400});
    const sql=getSql();let rows:any[]=[];
    if(entity==="time")rows=await sql`SELECT *,EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))/60 AS duration_minutes FROM org_time_entries WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY started_at DESC LIMIT 500`;
    if(entity==="schedule")rows=await sql`SELECT * FROM org_schedule_entries WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY starts_at LIMIT 500`;
    if(entity==="finance")rows=await sql`SELECT * FROM org_finance_entries WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY entry_date DESC,created_at DESC LIMIT 500`;
    if(entity==="reserves")rows=await sql`SELECT *,CASE WHEN due_date IS NULL THEN target_cents/GREATEST(interval_months,1) ELSE GREATEST(target_cents-saved_cents,0)/GREATEST(CEIL(EXTRACT(EPOCH FROM (due_date::timestamp-now()))/2629800),1) END AS monthly_required_cents FROM org_reserves WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY due_date NULLS LAST,name LIMIT 500`;
    if(entity==="family")rows=await sql`SELECT * FROM org_family_members WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY created_at LIMIT 100`;
    if(entity==="mail")rows=await sql`SELECT id,label,email,provider,connection_type,host,port,security,sync_enabled,last_sync_at,status,notes,created_at,updated_at,deleted_at FROM org_mail_accounts WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY created_at LIMIT 100`;
    if(entity==="documents")rows=await sql`SELECT * FROM org_documents WHERE owner_id=${ownerId} AND (${trash} OR deleted_at IS NULL) ORDER BY created_at DESC LIMIT 500`;
    return Response.json(rows);
  }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
  try{
    const ownerId=requestOwnerId(request);await ensureOrganizationSchema();
    const body=await request.json(),entity=String(body.entity||""),data=body.data||{};
    if(!validEntities.has(entity))return Response.json({error:"Unbekannter Datenbereich."},{status:400});
    const sql=getSql();let rows:any[]=[];
    if(entity==="time")rows=await sql`INSERT INTO org_time_entries(owner_id,source,area,activity,customer,location,notes,started_at,ended_at,travel_minutes,billable,volunteer,sunday,external_id,approval_status,hourly_rate_cents,travel_flat_cents) VALUES(${ownerId},${data.source||"organization"},${data.area||"erhard"},${data.activity||"Allgemeine Tätigkeit"},${data.customer||null},${data.location||null},${data.notes||null},${data.started_at},${data.ended_at||null},${Number(data.travel_minutes)||0},${!!data.billable},${!!data.volunteer},${!!data.sunday},${data.external_id||null},${data.approval_status||"confirmed"},${data.hourly_rate===""||data.hourly_rate==null?null:cents(data.hourly_rate)},${data.travel_flat===""||data.travel_flat==null?null:cents(data.travel_flat)}) RETURNING *`;
    if(entity==="schedule")rows=await sql`INSERT INTO org_schedule_entries(owner_id,category,title,starts_at,ends_at,location,notes,protected) VALUES(${ownerId},${data.category||"appointment"},${data.title},${data.starts_at},${data.ends_at||null},${data.location||null},${data.notes||null},${!!data.protected}) RETURNING *`;
    if(entity==="finance")rows=await sql`INSERT INTO org_finance_entries(owner_id,entry_date,kind,scope,category,description,amount_cents,recurring,interval_months,notes) VALUES(${ownerId},${data.entry_date},${data.kind||"expense"},${data.scope||"private"},${data.category||"Sonstiges"},${data.description},${cents(data.amount)},${!!data.recurring},${data.interval_months?Number(data.interval_months):null},${data.notes||null}) RETURNING *`;
    if(entity==="reserves")rows=await sql`INSERT INTO org_reserves(owner_id,name,scope,target_cents,saved_cents,due_date,interval_months,notes) VALUES(${ownerId},${data.name},${data.scope||"private"},${cents(data.target_amount)},${cents(data.saved_amount)},${data.due_date||null},${Number(data.interval_months)||12},${data.notes||null}) RETURNING *`;
    if(entity==="family")rows=await sql`INSERT INTO org_family_members(owner_id,name,member_role,monthly_allowance_cents,access_level,notes) VALUES(${ownerId},${data.name},${data.member_role||"child"},${cents(data.monthly_allowance)},${data.access_level||"own"},${data.notes||null}) RETURNING *`;
    if(entity==="mail")rows=await sql`INSERT INTO org_mail_accounts(owner_id,label,email,provider,connection_type,host,port,security,encrypted_secret,sync_enabled,status,notes) VALUES(${ownerId},${data.label},${data.email},${data.provider||"other"},${data.connection_type||"imap"},${data.host||null},${data.port?Number(data.port):null},${data.security||null},${data.secret?encryptSecret(String(data.secret)):null},${!!data.secret},${data.secret?'ready':'setup_required'},${data.notes||null}) RETURNING id,label,email,provider,connection_type,host,port,security,sync_enabled,status,notes,created_at`;
    if(entity==="documents")rows=await sql`INSERT INTO org_documents(owner_id,document_type,title,issuer,policy_number,amount_cents,due_date,interval_months,extracted_data,status) VALUES(${ownerId},${data.document_type||"other"},${data.title},${data.issuer||null},${data.policy_number||null},${data.amount===null||data.amount===undefined?null:cents(data.amount)},${data.due_date||null},${data.interval_months?Number(data.interval_months):null},${JSON.stringify(data.extracted_data||{})}::jsonb,'confirmed') RETURNING *`;
    const row=rows[0];await audit(ownerId,entity,String(row.id),"create",row);return Response.json(row,{status:201});
  }catch(error){return errorResponse(error)}
}

export async function PATCH(request:Request){
  try{
    const ownerId=requestOwnerId(request);await ensureOrganizationSchema();
    const body=await request.json(),entity=String(body.entity||""),id=String(body.id||""),data=body.data||{};
    if(!validEntities.has(entity)||!id)return Response.json({error:"Ungültige Änderung."},{status:400});
    const sql=getSql();let rows:any[]=[];
    if(entity==="time")rows=await sql`UPDATE org_time_entries SET area=${data.area},activity=${data.activity},customer=${data.customer||null},location=${data.location||null},notes=${data.notes||null},started_at=${data.started_at},ended_at=${data.ended_at||null},travel_minutes=${Number(data.travel_minutes)||0},billable=${!!data.billable},volunteer=${!!data.volunteer},sunday=${!!data.sunday},approval_status=${data.approval_status||"confirmed"},hourly_rate_cents=${data.hourly_rate===""||data.hourly_rate==null?null:cents(data.hourly_rate)},travel_flat_cents=${data.travel_flat===""||data.travel_flat==null?null:cents(data.travel_flat)},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="schedule")rows=await sql`UPDATE org_schedule_entries SET category=${data.category},title=${data.title},starts_at=${data.starts_at},ends_at=${data.ends_at||null},location=${data.location||null},notes=${data.notes||null},protected=${!!data.protected},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="finance")rows=await sql`UPDATE org_finance_entries SET entry_date=${data.entry_date},kind=${data.kind},scope=${data.scope},category=${data.category},description=${data.description},amount_cents=${cents(data.amount)},recurring=${!!data.recurring},interval_months=${data.interval_months?Number(data.interval_months):null},notes=${data.notes||null},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="reserves")rows=await sql`UPDATE org_reserves SET name=${data.name},scope=${data.scope},target_cents=${cents(data.target_amount)},saved_cents=${cents(data.saved_amount)},due_date=${data.due_date||null},interval_months=${Number(data.interval_months)||12},notes=${data.notes||null},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="family")rows=await sql`UPDATE org_family_members SET name=${data.name},member_role=${data.member_role},monthly_allowance_cents=${cents(data.monthly_allowance)},access_level=${data.access_level},notes=${data.notes||null},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="mail")rows=data.secret?await sql`UPDATE org_mail_accounts SET label=${data.label},email=${data.email},provider=${data.provider},connection_type=${data.connection_type},host=${data.host||null},port=${data.port?Number(data.port):null},security=${data.security||null},encrypted_secret=${encryptSecret(String(data.secret))},sync_enabled=true,status='ready',notes=${data.notes||null},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING id,label,email,provider,connection_type,host,port,security,sync_enabled,status,notes,updated_at`:await sql`UPDATE org_mail_accounts SET label=${data.label},email=${data.email},provider=${data.provider},connection_type=${data.connection_type},host=${data.host||null},port=${data.port?Number(data.port):null},security=${data.security||null},notes=${data.notes||null},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING id,label,email,provider,connection_type,host,port,security,sync_enabled,status,notes,updated_at`;
    if(entity==="documents")rows=await sql`UPDATE org_documents SET document_type=${data.document_type},title=${data.title},issuer=${data.issuer||null},policy_number=${data.policy_number||null},amount_cents=${data.amount===null||data.amount===undefined?null:cents(data.amount)},due_date=${data.due_date||null},interval_months=${data.interval_months?Number(data.interval_months):null},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(!rows.length)return Response.json({error:"Eintrag nicht gefunden."},{status:404});
    await audit(ownerId,entity,id,"update",rows[0]);return Response.json(rows[0]);
  }catch(error){return errorResponse(error)}
}

export async function DELETE(request:Request){
  try{
    const ownerId=requestOwnerId(request);await ensureOrganizationSchema();
    const body=await request.json(),entity=String(body.entity||""),id=String(body.id||""),restore=!!body.restore;
    const tables:Record<string,string>={time:"org_time_entries",schedule:"org_schedule_entries",finance:"org_finance_entries",reserves:"org_reserves",family:"org_family_members",mail:"org_mail_accounts",documents:"org_documents"};
    if(!tables[entity]||!id)return Response.json({error:"Ungültiger Eintrag."},{status:400});
    const sql=getSql();let rows:any[]=[];
    if(entity==="time")rows=await sql`UPDATE org_time_entries SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="schedule")rows=await sql`UPDATE org_schedule_entries SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="finance")rows=await sql`UPDATE org_finance_entries SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="reserves")rows=await sql`UPDATE org_reserves SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="family")rows=await sql`UPDATE org_family_members SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(entity==="mail")rows=await sql`UPDATE org_mail_accounts SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING id,label,email,deleted_at`;
    if(entity==="documents")rows=await sql`UPDATE org_documents SET deleted_at=${restore?null:new Date().toISOString()},updated_at=now() WHERE id=${id} AND owner_id=${ownerId} RETURNING *`;
    if(!rows.length)return Response.json({error:"Eintrag nicht gefunden."},{status:404});
    await audit(ownerId,entity,id,restore?"restore":"trash",rows[0]);return Response.json({ok:true,item:rows[0]});
  }catch(error){return errorResponse(error)}
}
