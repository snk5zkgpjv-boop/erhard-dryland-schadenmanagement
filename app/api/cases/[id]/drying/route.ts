import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function optNum(v:unknown){if(v===null||v===undefined||v==="")return null;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:null}

export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{const{id}=await params,sql=getSql();const rows=await sql`SELECT d.id,d.room,d.installed_at,d.removed_at,d.drying_method,d.notes,
   d.runtime_days_override,d.power_kw_override,d.consumption_kwh_override,
   c.name AS company_name,e.id equipment_id,e.equipment_code,e.name equipment_name,e.equipment_type,e.power_watts
   FROM drying_installations d JOIN companies c ON c.id=d.company_id LEFT JOIN equipment e ON e.id=d.equipment_id
   WHERE d.case_id=${id} ORDER BY d.installed_at DESC,e.name`;return Response.json(rows)}
 catch(e){return Response.json({error:e instanceof Error?e.message:"Trocknung konnte nicht geladen werden."},{status:500})}
}

export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,b=await r.json(),sql=getSql();
  const quantities=(b.equipment_quantities&&typeof b.equipment_quantities==="object")?b.equipment_quantities:{};
  const selections=Object.entries(quantities).map(([equipmentId,q])=>({equipmentId,count:Math.max(0,Math.min(50,Number(q)||0))})).filter(x=>x.count>0);
  const legacyIds=Array.isArray(b.equipment_ids)?b.equipment_ids.filter(Boolean).map((equipmentId:string)=>({equipmentId:String(equipmentId),count:1})):[];
  const chosen=selections.length?selections:legacyIds,ids:string[]=[];
  if(chosen.length===0){
   const rows=await sql`INSERT INTO drying_installations(case_id,company_id,room,installed_at,removed_at,drying_method,notes)
    VALUES(${id},${txt(b.company_id)},${txt(b.room)},COALESCE(${txt(b.installed_at)}::timestamptz,now()),${txt(b.removed_at)}::timestamptz,${txt(b.drying_method)},${txt(b.notes)}) RETURNING id`;
   ids.push(rows[0].id as string)
  }else for(const sel of chosen)for(let i=0;i<sel.count;i++){
   const rows=await sql`INSERT INTO drying_installations(case_id,company_id,equipment_id,room,installed_at,removed_at,drying_method,notes)
    VALUES(${id},${txt(b.company_id)},${sel.equipmentId},${txt(b.room)},COALESCE(${txt(b.installed_at)}::timestamptz,now()),${txt(b.removed_at)}::timestamptz,${txt(b.drying_method)},${txt(b.notes)}) RETURNING id`;
   ids.push(rows[0].id as string)
  }
  return Response.json({ids,quantity:ids.length},{status:201})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Trocknung konnte nicht gespeichert werden."},{status:500})}
}

export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,b=await r.json(),installationId=txt(b.installation_id);if(!installationId)return Response.json({error:"Trocknungs-ID fehlt."},{status:400});
  const sql=getSql();const rows=await sql`UPDATE drying_installations SET
   equipment_id=COALESCE(${txt(b.equipment_id)},equipment_id),room=COALESCE(${txt(b.room)},room),
   installed_at=COALESCE(${txt(b.installed_at)}::timestamptz,installed_at),
   removed_at=CASE WHEN ${b.hasOwnProperty("removed_at")} THEN ${txt(b.removed_at)}::timestamptz ELSE removed_at END,
   drying_method=COALESCE(${txt(b.drying_method)},drying_method),notes=COALESCE(${txt(b.notes)},notes),
   runtime_days_override=${optNum(b.runtime_days_override)},
   power_kw_override=${optNum(b.power_kw_override)},
   consumption_kwh_override=${optNum(b.consumption_kwh_override)}
   WHERE id=${installationId} AND case_id=${id} RETURNING id`;
  if(!rows.length)return Response.json({error:"Trocknung nicht gefunden."},{status:404});return Response.json({ok:true})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Trocknung konnte nicht geändert werden."},{status:500})}
}

export async function DELETE(r:Request,{params}:{params:Promise<{id:string}>}){
 try{const{id}=await params,b=await r.json(),installationId=txt(b.installation_id);if(!installationId)return Response.json({error:"Trocknungs-ID fehlt."},{status:400});const sql=getSql();const rows=await sql`DELETE FROM drying_installations WHERE id=${installationId} AND case_id=${id} RETURNING id`;if(!rows.length)return Response.json({error:"Trocknung nicht gefunden."},{status:404});return Response.json({ok:true})}
 catch(e){return Response.json({error:e instanceof Error?e.message:"Trocknung konnte nicht gelöscht werden."},{status:500})}
}
