import {getSql} from "@/lib/db";
import {allocateNumber,syncManualNumber} from "@/lib/number-sequences";
function clean(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}

export async function GET(request:Request){
 try{
  const userId=request.headers.get("x-app-user-id");
  if(!userId)return Response.json({error:"Nicht angemeldet."},{status:401});
  const sql=getSql();
  const rows=await sql`SELECT c.id,c.title,c.case_number,c.status,c.damage_type,c.object_street,c.object_postal_code,c.object_city,c.created_at,co.code AS company_code,co.name AS company_name
    FROM cases c
    JOIN companies co ON co.id=c.company_id
    JOIN app_user_companies auc ON auc.company_id=c.company_id AND auc.user_id=${userId}
    ORDER BY c.created_at DESC`;
  return Response.json(rows)
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Schadensfälle konnten nicht geladen werden."},{status:500})}
}

export async function POST(request:Request){
 try{
  const userId=request.headers.get("x-app-user-id");
  if(!userId)return Response.json({error:"Nicht angemeldet."},{status:401});
  const body=await request.json();const companyId=clean(body.company_id);const title=clean(body.title);
  if(!companyId||!title)return Response.json({error:"Firma und Bezeichnung sind Pflichtfelder."},{status:400});
  const sql=getSql();
  const allowed=await sql`SELECT 1 FROM app_user_companies WHERE user_id=${userId} AND company_id=${companyId} LIMIT 1`;
  if(!allowed.length)return Response.json({error:"Du bist dieser Firma nicht zugeordnet."},{status:403});

  const firstName=clean(body.customer_first_name),lastName=clean(body.customer_last_name),companyName=clean(body.customer_company_name);
  const customerStreet=clean(body.customer_street),customerPostal=clean(body.customer_postal_code),customerCity=clean(body.customer_city),customerEmail=clean(body.customer_email),customerPhone=clean(body.customer_phone);
  let customerId:string|null=null;
  if(firstName||lastName||companyName||customerStreet||customerPostal||customerCity||customerEmail||customerPhone){
   const customers=await sql`INSERT INTO customers(kind,company_name,first_name,last_name,street,postal_code,city,email,phone)
    VALUES (${companyName?"company":"person"},${companyName},${firstName},${lastName},${customerStreet},${customerPostal},${customerCity},${customerEmail},${customerPhone}) RETURNING id`;
   customerId=customers[0].id as string
  }
  const manual=clean(body.case_number);
  const caseNumber=manual||await allocateNumber(sql,companyId,"project",new Date());
  if(manual)await syncManualNumber(sql,companyId,"project",new Date(),manual);
  const rows=await sql`INSERT INTO cases(company_id,customer_id,case_number,title,status,damage_type,object_street,object_postal_code,object_city,floor,unit,insurer,insurance_number,claim_number,reference_number,damage_cause,damage_description,recommended_action,started_at)
   VALUES (${companyId},${customerId},${caseNumber},${title},'neu',${clean(body.damage_type)||'wasserschaden'},${clean(body.object_street)},${clean(body.object_postal_code)},${clean(body.object_city)},${clean(body.floor)},${clean(body.unit)},${clean(body.insurer)},${clean(body.insurance_number)},${clean(body.claim_number)},${clean(body.reference_number)},${clean(body.damage_cause)},${clean(body.damage_description)},${clean(body.recommended_action)},now()) RETURNING id,case_number`;
  return Response.json({id:rows[0].id,case_number:rows[0].case_number},{status:201})
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Schaden konnte nicht angelegt werden."},{status:500})}
}
