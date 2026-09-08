import {getSql} from "@/lib/db";
import {allocateNumber} from "@/lib/number-sequences";
export async function POST(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,sql=getSql();
  const c=await sql`SELECT company_id,insurer,claim_number,insurance_number,recommended_action FROM cases WHERE id=${id} LIMIT 1`;
  if(!c.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});
  const o=await sql`SELECT id,document_number FROM documents WHERE case_id=${id} AND document_type='angebot' ORDER BY document_date DESC,created_at DESC LIMIT 1`;
  if(!o.length)return Response.json({error:"Bitte zuerst ein Angebot erstellen."},{status:400});
  const items=await sql`SELECT position_no,description,quantity,unit FROM document_items WHERE document_id=${o[0].id} ORDER BY sort_order,created_at`;
  const scope=items.length
    ? items.map((x:any)=>`${x.position_no||""} ${x.description} – ${Number(x.quantity||0).toLocaleString("de-DE")} ${x.unit||""}`.trim()).join("\n")
    : String(c[0].recommended_action||"");
  const ex=await sql`SELECT id,assignment_number FROM assignments WHERE case_id=${id} ORDER BY created_at DESC LIMIT 1`;
  if(ex.length){
   await sql`UPDATE assignments SET assignment_date=CURRENT_DATE,scope=${scope},insurer=${c[0].insurer},claim_number=${c[0].claim_number},insurance_number=${c[0].insurance_number} WHERE id=${ex[0].id}`;
   return Response.json({id:ex[0].id,assignment_number:ex[0].assignment_number,offer_id:o[0].id})
  }
  const assignmentNumber=await allocateNumber(sql,c[0].company_id,"assignment",new Date());
  const a=await sql`INSERT INTO assignments(case_id,company_id,assignment_number,assignment_date,scope,insurer,claim_number,insurance_number)
    VALUES(${id},${c[0].company_id},${assignmentNumber},CURRENT_DATE,${scope},${c[0].insurer},${c[0].claim_number},${c[0].insurance_number}) RETURNING id,assignment_number`;
  return Response.json({id:a[0].id,assignment_number:a[0].assignment_number,offer_id:o[0].id},{status:201})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Auftragserteilung konnte nicht erzeugt werden."},{status:500})}
}
