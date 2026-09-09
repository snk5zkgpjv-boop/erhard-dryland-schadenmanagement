import {getSql} from "@/lib/db";
import {allocateNumber,syncManualNumber} from "@/lib/number-sequences";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){const n=Number(v);return Number.isFinite(n)?n:0}

async function access(request:Request,companyId:string){
  const userId=request.headers.get("x-app-user-id");
  if(!userId)return false;
  const sql=getSql();
  const rows=await sql`SELECT 1 FROM app_user_companies WHERE user_id=${userId} AND company_id=${companyId} LIMIT 1`;
  return rows.length>0
}

export async function GET(r:Request){
 try{
  const userId=r.headers.get("x-app-user-id");
  if(!userId)return Response.json({error:"Nicht angemeldet."},{status:401});
  const u=new URL(r.url),caseId=u.searchParams.get("case_id");const sql=getSql();
  const rows=caseId
    ? await sql`SELECT d.* FROM documents d
        JOIN app_user_companies auc ON auc.company_id=d.company_id AND auc.user_id=${userId}
        WHERE d.case_id=${caseId} ORDER BY d.updated_at DESC`
    : await sql`SELECT d.*,c.title case_title,co.name company_name
        FROM documents d
        LEFT JOIN cases c ON c.id=d.case_id
        JOIN companies co ON co.id=d.company_id
        JOIN app_user_companies auc ON auc.company_id=d.company_id AND auc.user_id=${userId}
        ORDER BY d.updated_at DESC LIMIT 100`;
  return Response.json(rows)
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Dokumente konnten nicht geladen werden."},{status:500})}
}

export async function POST(r:Request){
 try{
  if(!["admin","buero"].includes(r.headers.get("x-app-role")||""))return Response.json({error:"Keine Berechtigung."},{status:403});
  const b=await r.json(),sql=getSql();
  const items=Array.isArray(b.items)?b.items:[];
  const companyId=txt(b.company_id);if(!companyId)return Response.json({error:"Firma fehlt."},{status:400});
  if(!await access(r,companyId))return Response.json({error:"Keine Berechtigung für diese Firma."},{status:403});
  const reverseCharge=Boolean(b.reverse_charge);
  const net=items.reduce((s:any,x:any)=>s+num(x.quantity)*num(x.unit_price),0);
  const vat=reverseCharge?0:items.reduce((s:any,x:any)=>s+num(x.quantity)*num(x.unit_price)*(num(x.vat_rate)/100),0);
  const docType=txt(b.document_type)||"angebot",docDate=txt(b.document_date)||new Date().toISOString().slice(0,10);
  const seqType=docType==="rechnung"?"invoice":"offer";
  const manual=txt(b.document_number);
  const documentNumber=manual||await allocateNumber(sql,companyId,seqType,docDate);
  if(manual)await syncManualNumber(sql,companyId,seqType,docDate,manual);

  const rows=await sql`
    INSERT INTO documents(
      case_id,company_id,document_type,document_number,document_date,title,status,
      net_total,vat_total,gross_total,reverse_charge,
      service_period_from,service_period_to,
      delivery_name,delivery_street,delivery_postal_code,delivery_city
    )
    VALUES(
      ${txt(b.case_id)},${companyId},${docType},
      ${documentNumber},${docDate}::date,
      ${txt(b.title)},${txt(b.status)||"entwurf"},
      ${net},${vat},${net+vat},${reverseCharge},
      ${txt(b.service_period_from)}::date,${txt(b.service_period_to)}::date,
      ${txt(b.delivery_name)},${txt(b.delivery_street)},${txt(b.delivery_postal_code)},${txt(b.delivery_city)}
    )
    RETURNING id,document_number`;
  const id=rows[0].id as string;

  let n=1;
  for(const x of items){
    await sql`
      INSERT INTO document_items(
        document_id,position_no,category,description,quantity,unit,unit_price,vat_rate,line_total,source_type,sort_order
      )
      VALUES(
        ${id},${String(n)},${txt(x.category)},${txt(x.description)},${num(x.quantity)},
        ${txt(x.unit)},${num(x.unit_price)},
        ${x.vat_rate===null||x.vat_rate===undefined||x.vat_rate===""?19:num(x.vat_rate)},
        ${num(x.quantity)*num(x.unit_price)},${txt(x.source_type)||"catalog"},${n}
      )`;
    n++
  }
  return Response.json({id,document_number:rows[0].document_number},{status:201})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Dokument konnte nicht gespeichert werden."},{status:500})}
}
