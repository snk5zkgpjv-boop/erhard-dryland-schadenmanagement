import {getSql} from "@/lib/db";
function clean(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params;const sql=getSql();
  const rows=await sql`SELECT c.*,co.code AS company_code,co.name AS company_name,
    cu.id AS customer_id_detail,cu.first_name AS customer_first_name,cu.last_name AS customer_last_name,
    cu.company_name AS customer_company_name,cu.street AS customer_street,cu.postal_code AS customer_postal_code,
    cu.city AS customer_city,cu.email AS customer_email,cu.phone AS customer_phone,
    NULLIF(TRIM(CONCAT_WS(' ',cu.first_name,cu.last_name)),'') AS person_name
    FROM cases c JOIN companies co ON co.id=c.company_id LEFT JOIN customers cu ON cu.id=c.customer_id WHERE c.id=${id} LIMIT 1`;
  if(rows.length===0)return Response.json({error:"Schaden nicht gefunden."},{status:404});
  const row=rows[0] as Record<string,unknown>;
  return Response.json({...row,customer_name:row.customer_company_name||row.person_name||null})
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Schaden konnte nicht geladen werden."},{status:500})}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params;const b=await request.json();const sql=getSql();
  const current=await sql`SELECT id,customer_id FROM cases WHERE id=${id} LIMIT 1`;
  if(!current.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});

  const first=clean(b.customer_first_name),last=clean(b.customer_last_name),company=clean(b.customer_company_name),
        street=clean(b.customer_street),postal=clean(b.customer_postal_code),city=clean(b.customer_city),
        email=clean(b.customer_email),phone=clean(b.customer_phone);
  const hasCustomer=Boolean(first||last||company||street||postal||city||email||phone);
  let customerId=current[0].customer_id as string|null;

  if(customerId){
   await sql`UPDATE customers SET kind=${company?"company":"person"},company_name=${company},first_name=${first},last_name=${last},
     street=${street},postal_code=${postal},city=${city},email=${email},phone=${phone},updated_at=now() WHERE id=${customerId}`;
  }else if(hasCustomer){
   const created=await sql`INSERT INTO customers(kind,company_name,first_name,last_name,street,postal_code,city,email,phone)
    VALUES(${company?"company":"person"},${company},${first},${last},${street},${postal},${city},${email},${phone}) RETURNING id`;
   customerId=created[0].id as string;
  }

  await sql`UPDATE cases SET
    customer_id=${customerId},case_number=${clean(b.case_number)},title=COALESCE(${clean(b.title)},title),
    object_street=${clean(b.object_street)},object_postal_code=${clean(b.object_postal_code)},object_city=${clean(b.object_city)},
    floor=${clean(b.floor)},unit=${clean(b.unit)},insurer=${clean(b.insurer)},insurance_number=${clean(b.insurance_number)},
    claim_number=${clean(b.claim_number)},reference_number=${clean(b.reference_number)},damage_cause=${clean(b.damage_cause)},
    damage_description=${clean(b.damage_description)},recommended_action=${clean(b.recommended_action)},updated_at=now()
    WHERE id=${id}`;
  return Response.json({ok:true})
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Schadensdaten konnten nicht gespeichert werden."},{status:500})}
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(_request.headers.get("x-app-role")!=="admin") return Response.json({error:"Nur Admin-Benutzer dürfen Schadensfälle löschen."},{status:403});
  try{
    const{id}=await params;const sql=getSql();
    const rows=await sql`DELETE FROM cases WHERE id=${id} RETURNING id`;
    if(!rows.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});
    return Response.json({ok:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Schaden konnte nicht gelöscht werden."},{status:500})}
}
