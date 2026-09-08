import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){const t=typeof v==="string"?v.trim().replace(",","."):"";if(!t)return null;const n=Number(t);return Number.isFinite(n)?n:null}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const sql=getSql();const rows=await sql`
    SELECT id,measured_at,room,floor,component,method,device,value_numeric,unit,reference_value,assessment,notes,photo_id
    FROM measurements WHERE case_id=${id} ORDER BY measured_at DESC,created_at DESC`;return Response.json(rows)}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Messungen konnten nicht geladen werden."},{status:500})}
}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const b=await r.json();const sql=getSql();const rows=await sql`
    INSERT INTO measurements(case_id,measured_at,room,floor,component,method,device,value_numeric,unit,reference_value,assessment,notes)
    VALUES(${id},COALESCE(${txt(b.measured_at)}::timestamptz,now()),${txt(b.room)},${txt(b.floor)},${txt(b.component)},${txt(b.method)},${txt(b.device)},${num(b.value_numeric)},${txt(b.unit)},${num(b.reference_value)},${txt(b.assessment)},${txt(b.notes)})
    RETURNING id`;return Response.json({id:rows[0].id},{status:201})}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Messung konnte nicht gespeichert werden."},{status:500})}
}
