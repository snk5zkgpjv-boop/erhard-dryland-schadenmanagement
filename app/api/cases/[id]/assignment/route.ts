import {getSql} from "@/lib/db";
import {allocateNumber} from "@/lib/number-sequences";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){try{const{id}=await params,sql=getSql();const rows=await sql`SELECT * FROM assignments WHERE case_id=${id} ORDER BY created_at DESC LIMIT 1`;return Response.json(rows[0]||null)}catch(e){return Response.json({error:e instanceof Error?e.message:"Auftragserteilung konnte nicht geladen werden."},{status:500})}}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,b=await r.json(),sql=getSql();
  const c=await sql`SELECT company_id FROM cases WHERE id=${id} LIMIT 1`;if(!c.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});
  const ex=await sql`SELECT id,assignment_number FROM assignments WHERE case_id=${id} ORDER BY created_at DESC LIMIT 1`;
  if(ex.length){
   await sql`UPDATE assignments SET assignment_date=COALESCE(${txt(b.assignment_date)}::date,CURRENT_DATE),scope=${txt(b.scope)},insurer=${txt(b.insurer)},claim_number=${txt(b.claim_number)},insurance_number=${txt(b.insurance_number)} WHERE id=${ex[0].id}`;
   return Response.json({id:ex[0].id,assignment_number:ex[0].assignment_number})
  }
  const assignmentDate=txt(b.assignment_date)||new Date().toISOString().slice(0,10);
  const assignmentNumber=await allocateNumber(sql,c[0].company_id,"assignment",assignmentDate);
  const rows=await sql`INSERT INTO assignments(case_id,company_id,assignment_number,assignment_date,scope,insurer,claim_number,insurance_number)
    VALUES(${id},${c[0].company_id},${assignmentNumber},${assignmentDate}::date,${txt(b.scope)},${txt(b.insurer)},${txt(b.claim_number)},${txt(b.insurance_number)}) RETURNING id,assignment_number`;
  return Response.json({id:rows[0].id,assignment_number:rows[0].assignment_number},{status:201})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Auftragserteilung konnte nicht gespeichert werden."},{status:500})}
}
