import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function intv(v:unknown){const n=Number(v);return Number.isFinite(n)?Math.trunc(n):0}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const sql=getSql();const rows=await sql`
    SELECT w.id,w.report_date,w.report_number,w.worker_name,w.function,w.work_start,w.work_end,w.break_minutes,w.vehicle_count,w.trips_count,w.description,w.follow_up_work,c.name AS company_name
    FROM work_reports w JOIN companies c ON c.id=w.company_id
    WHERE w.case_id=${id} ORDER BY w.report_date DESC,w.created_at DESC`;return Response.json(rows)}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Rapporte konnten nicht geladen werden."},{status:500})}
}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const b=await r.json();const sql=getSql();const rows=await sql`
    INSERT INTO work_reports(case_id,company_id,report_date,report_number,worker_name,function,work_start,work_end,break_minutes,vehicle_count,trips_count,description,follow_up_work)
    VALUES(${id},${txt(b.company_id)},COALESCE(${txt(b.report_date)}::date,CURRENT_DATE),${txt(b.report_number)},${txt(b.worker_name)},${txt(b.function)},${txt(b.work_start)}::time,${txt(b.work_end)}::time,${intv(b.break_minutes)},${intv(b.vehicle_count)},${intv(b.trips_count)},${txt(b.description)},${txt(b.follow_up_work)})
    RETURNING id`;return Response.json({id:rows[0].id},{status:201})}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Rapport konnte nicht gespeichert werden."},{status:500})}
}
