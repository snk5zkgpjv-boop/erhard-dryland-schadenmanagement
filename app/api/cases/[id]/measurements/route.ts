import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){const t=typeof v==="string"?v.trim().replace(",","."):"";if(!t)return null;const n=Number(t);return Number.isFinite(n)?n:null}

export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const sql=getSql();
    const rows=await sql`
      SELECT m.id,m.measured_at,m.room,m.floor,m.component,m.method,m.device,m.value_numeric,m.unit,m.reference_value,m.assessment,m.notes,m.photo_id,
             p.file_url AS photo_url,p.caption AS photo_caption
      FROM measurements m
      LEFT JOIN photos p ON p.id=m.photo_id
      WHERE m.case_id=${id}
      ORDER BY m.measured_at DESC,m.created_at DESC`;
    return Response.json(rows)
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Messungen konnten nicht geladen werden."},{status:500})}
}

export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const b=await r.json();const sql=getSql();
    const rows=await sql`
      INSERT INTO measurements(case_id,measured_at,room,floor,component,method,device,value_numeric,unit,reference_value,assessment,notes,photo_id)
      VALUES(${id},COALESCE(${txt(b.measured_at)}::timestamptz,now()),${txt(b.room)},${txt(b.floor)},${txt(b.component)},${txt(b.method)},${txt(b.device)},${num(b.value_numeric)},${txt(b.unit)},${num(b.reference_value)},${txt(b.assessment)},${txt(b.notes)},${txt(b.photo_id)})
      RETURNING id`;
    return Response.json({id:rows[0].id},{status:201})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Messung konnte nicht gespeichert werden."},{status:500})}
}

export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const b=await r.json();const measurementId=txt(b.measurement_id);
    if(!measurementId)return Response.json({error:"Messungs-ID fehlt."},{status:400});
    const sql=getSql();

    const current=await sql`SELECT photo_id FROM measurements WHERE id=${measurementId} AND case_id=${id} LIMIT 1`;
    if(!current.length)return Response.json({error:"Messung nicht gefunden."},{status:404});

    let photoId:any=current[0].photo_id||null;
    if(b.remove_photo===true){
      if(photoId)await sql`DELETE FROM photos WHERE id=${photoId} AND case_id=${id}`;
      photoId=null;
    }else if(txt(b.photo_id)){
      const old=photoId;
      photoId=txt(b.photo_id);
      if(old&&String(old)!==String(photoId))await sql`DELETE FROM photos WHERE id=${old} AND case_id=${id}`;
    }

    const rows=await sql`
      UPDATE measurements SET
        measured_at=COALESCE(${txt(b.measured_at)}::timestamptz,measured_at),
        room=${txt(b.room)},floor=${txt(b.floor)},component=${txt(b.component)},method=${txt(b.method)},device=${txt(b.device)},
        value_numeric=${num(b.value_numeric)},unit=${txt(b.unit)},reference_value=${num(b.reference_value)},
        assessment=${txt(b.assessment)},notes=${txt(b.notes)},photo_id=${photoId}
      WHERE id=${measurementId} AND case_id=${id}
      RETURNING id`;
    return Response.json({ok:true})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Messung konnte nicht geändert werden."},{status:500})}
}

export async function DELETE(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const b=await r.json();const measurementId=txt(b.measurement_id);
    if(!measurementId)return Response.json({error:"Messungs-ID fehlt."},{status:400});
    const sql=getSql();
    const found=await sql`SELECT photo_id FROM measurements WHERE id=${measurementId} AND case_id=${id} LIMIT 1`;
    if(!found.length)return Response.json({error:"Messung nicht gefunden."},{status:404});
    await sql`DELETE FROM measurements WHERE id=${measurementId} AND case_id=${id}`;
    if(found[0].photo_id)await sql`DELETE FROM photos WHERE id=${found[0].photo_id}`;
    return Response.json({ok:true})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Messung konnte nicht gelöscht werden."},{status:500})}
}
