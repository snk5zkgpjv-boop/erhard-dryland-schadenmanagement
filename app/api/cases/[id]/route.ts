import {getSql} from "@/lib/db";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const{id}=await params;const sql=getSql();const rows=await sql`SELECT c.*,co.code AS company_code,co.name AS company_name,NULLIF(TRIM(CONCAT_WS(' ',cu.first_name,cu.last_name)),'') AS person_name,cu.company_name AS customer_company_name FROM cases c JOIN companies co ON co.id=c.company_id LEFT JOIN customers cu ON cu.id=c.customer_id WHERE c.id=${id} LIMIT 1`;if(rows.length===0)return Response.json({error:"Schaden nicht gefunden."},{status:404});const row=rows[0] as Record<string,unknown>;return Response.json({...row,customer_name:row.customer_company_name||row.person_name||null})}catch(error){return Response.json({error:error instanceof Error?error.message:"Schaden konnte nicht geladen werden."},{status:500})}}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(_request.headers.get("x-app-role")!=="admin") return Response.json({error:"Nur Admin-Benutzer dürfen Schadensfälle löschen."},{status:403});
  try{
    const{id}=await params;const sql=getSql();
    const rows=await sql`DELETE FROM cases WHERE id=${id} RETURNING id`;
    if(!rows.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});
    return Response.json({ok:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Schaden konnte nicht gelöscht werden."},{status:500})}
}
