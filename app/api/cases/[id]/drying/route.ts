import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const sql=getSql();const rows=await sql`
    SELECT d.id,d.room,d.installed_at,d.removed_at,d.drying_method,d.notes,c.name AS company_name
    FROM drying_installations d JOIN companies c ON c.id=d.company_id
    WHERE d.case_id=${id} ORDER BY d.installed_at DESC`;return Response.json(rows)}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Trocknung konnte nicht geladen werden."},{status:500})}
}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const b=await r.json();const sql=getSql();const rows=await sql`
    INSERT INTO drying_installations(case_id,company_id,room,installed_at,removed_at,drying_method,notes)
    VALUES(${id},${txt(b.company_id)},${txt(b.room)},COALESCE(${txt(b.installed_at)}::timestamptz,now()),${txt(b.removed_at)}::timestamptz,${txt(b.drying_method)},${txt(b.notes)})
    RETURNING id`;return Response.json({id:rows[0].id},{status:201})}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Trocknung konnte nicht gespeichert werden."},{status:500})}
}
