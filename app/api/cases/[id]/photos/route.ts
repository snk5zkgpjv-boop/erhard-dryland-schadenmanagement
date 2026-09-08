import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const sql=getSql();const rows=await sql`
    SELECT id,category,room,component,caption,ai_description,file_url,captured_at,sort_order,created_at
    FROM photos WHERE case_id=${id} ORDER BY sort_order,created_at`;return Response.json(rows)}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Fotos konnten nicht geladen werden."},{status:500})}
}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const b=await r.json();if(!b.file_url)return Response.json({error:"Kein Bild übertragen."},{status:400});
    const sql=getSql();const rows=await sql`
    INSERT INTO photos(case_id,category,room,component,caption,ai_description,file_url,captured_at)
    VALUES(${id},${txt(b.category)||"schadensbild"},${txt(b.room)},${txt(b.component)},${txt(b.caption)},${txt(b.ai_description)},${String(b.file_url)},now())
    RETURNING id`;return Response.json({id:rows[0].id},{status:201})}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Foto konnte nicht gespeichert werden."},{status:500})}
}
