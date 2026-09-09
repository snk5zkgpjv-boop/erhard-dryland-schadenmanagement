import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}

export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{const{id}=await params;const sql=getSql();const rows=await sql`
    SELECT id,category,room,component,caption,ai_description,file_url,captured_at,sort_order,created_at
    FROM photos WHERE case_id=${id} ORDER BY sort_order,created_at`;return Response.json(rows)}
  catch(e){return Response.json({error:e instanceof Error?e.message:"Fotos konnten nicht geladen werden."},{status:500})}
}

export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const b=await r.json();
    if(!b.file_url)return Response.json({error:"Kein Bild übertragen."},{status:400});
    const sql=getSql();const rows=await sql`
      INSERT INTO photos(case_id,category,room,component,caption,ai_description,file_url,captured_at)
      VALUES(${id},${txt(b.category)||"schadensbild"},${txt(b.room)},${txt(b.component)},${txt(b.caption)},${txt(b.ai_description)},${String(b.file_url)},now())
      RETURNING id`;
    return Response.json({id:rows[0].id},{status:201})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Foto konnte nicht gespeichert werden."},{status:500})}
}

export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params,b=await r.json(),sql=getSql();
    const photoId=txt(b.photo_id);
    if(!photoId)return Response.json({error:"Foto-ID fehlt."},{status:400});
    const found=await sql`SELECT id FROM photos WHERE id=${photoId} AND case_id=${id} LIMIT 1`;
    if(!found.length)return Response.json({error:"Foto nicht gefunden."},{status:404});

    const rows=await sql`
      UPDATE photos SET
        category=COALESCE(${txt(b.category)},category),
        room=${txt(b.room)},
        component=${txt(b.component)},
        caption=${txt(b.caption)},
        ai_description=COALESCE(${txt(b.ai_description)},ai_description),
        file_url=COALESCE(${txt(b.file_url)},file_url)
      WHERE id=${photoId} AND case_id=${id}
      RETURNING id`;
    return Response.json({ok:true,id:rows[0].id})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Foto konnte nicht geändert werden."},{status:500})}
}

export async function DELETE(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params,b=await r.json(),sql=getSql();
    const photoId=txt(b.photo_id),fileUrl=txt(b.file_url);
    if(!photoId&&!fileUrl)return Response.json({error:"Foto-ID oder Bildadresse fehlt."},{status:400});

    const found=photoId
      ? await sql`SELECT id,file_url FROM photos WHERE id=${photoId} AND case_id=${id} LIMIT 1`
      : await sql`SELECT id,file_url FROM photos WHERE file_url=${fileUrl} AND case_id=${id} LIMIT 1`;

    if(!found.length)return Response.json({error:"Foto nicht gefunden."},{status:404});
    const idToDelete=String(found[0].id);

    await sql`UPDATE measurements SET photo_id=NULL WHERE case_id=${id} AND photo_id=${idToDelete}`;
    await sql`DELETE FROM photos WHERE id=${idToDelete} AND case_id=${id}`;
    return Response.json({ok:true,id:idToDelete})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Foto konnte nicht gelöscht werden."},{status:500})}
}
