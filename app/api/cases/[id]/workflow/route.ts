import {getSql} from "@/lib/db";
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,sql=getSql();
  const [offers,invoices,assignments,drying,reports]=await Promise.all([
   sql`SELECT id,document_number,document_date,status FROM documents WHERE case_id=${id} AND document_type='angebot' ORDER BY document_date DESC,created_at DESC LIMIT 1`,
   sql`SELECT id,document_number,document_date,status FROM documents WHERE case_id=${id} AND document_type='rechnung' ORDER BY document_date DESC,created_at DESC LIMIT 1`,
   sql`SELECT id,assignment_date FROM assignments WHERE case_id=${id} ORDER BY created_at DESC LIMIT 1`,
   sql`SELECT count(*)::int total,count(*) FILTER(WHERE removed_at IS NOT NULL)::int finished FROM drying_installations WHERE case_id=${id}`,
   sql`SELECT count(*)::int total FROM work_reports WHERE case_id=${id}`
  ]);
  const offer:any=offers[0]||null,invoice:any=invoices[0]||null,assignment:any=assignments[0]||null;
  const dry:any=drying[0]||{total:0,finished:0},rep:any=reports[0]||{total:0};
  const executionStarted=Number(dry.total)>0||Number(rep.total)>0;
  const executionFinished=Number(dry.total)>0
    ? Number(dry.total)===Number(dry.finished)
    : Number(rep.total)>0;
  const paid=invoice?.status==="bezahlt";
  let phase=0;
  if(offer)phase=1;if(assignment)phase=2;if(executionStarted)phase=3;if(executionFinished)phase=4;if(invoice)phase=5;if(paid)phase=6;
  return Response.json({offer,assignment,invoice,drying:dry,reports:rep,executionStarted,executionFinished,paid,phase})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Workflow konnte nicht geladen werden."},{status:500})}
}
