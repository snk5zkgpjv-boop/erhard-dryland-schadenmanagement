import {getSql} from "@/lib/db";
import {syncManualNumber} from "@/lib/number-sequences";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){const n=Number(v);return Number.isFinite(n)?n:0}

async function allowed(request:Request,id:string){
  const userId=request.headers.get("x-app-user-id");
  if(!userId)return {error:Response.json({error:"Nicht angemeldet."},{status:401})};
  const sql=getSql();
  const rows=await sql`SELECT d.company_id FROM documents d
    JOIN app_user_companies auc ON auc.company_id=d.company_id AND auc.user_id=${userId}
    WHERE d.id=${id} LIMIT 1`;
  if(!rows.length)return {error:Response.json({error:"Kein Zugriff auf dieses Dokument."},{status:403})};
  return {sql,companyId:String(rows[0].company_id)}
}

export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,a=await allowed(r,id);if(a.error)return a.error;const sql:any=a.sql;
  const d=await sql`
    SELECT d.*,c.title case_title,c.object_street,c.object_postal_code,c.object_city,c.customer_id,
           co.code company_code,co.name company_name,
           cu.first_name,cu.last_name,cu.company_name customer_company_name,
           cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city
    FROM documents d
    LEFT JOIN cases c ON c.id=d.case_id
    JOIN companies co ON co.id=d.company_id
    LEFT JOIN customers cu ON cu.id=c.customer_id
    WHERE d.id=${id} LIMIT 1`;
  if(!d.length)return Response.json({error:"Dokument nicht gefunden."},{status:404});
  const items=await sql`SELECT * FROM document_items WHERE document_id=${id} ORDER BY sort_order,created_at`;
  return Response.json({...d[0],items})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Dokument konnte nicht geladen werden."},{status:500})}
}

export async function PUT(r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!["admin","buero"].includes(r.headers.get("x-app-role")||""))return Response.json({error:"Keine Berechtigung."},{status:403});
  const{id}=await params,a=await allowed(r,id);if(a.error)return a.error;const sql:any=a.sql,companyId=String(a.companyId);
  const b=await r.json(),items=Array.isArray(b.items)?b.items:[];
  const reverseCharge=Boolean(b.reverse_charge);
  const net=items.reduce((s:any,x:any)=>s+num(x.quantity)*num(x.unit_price),0);
  const vat=reverseCharge?0:items.reduce((s:any,x:any)=>s+num(x.quantity)*num(x.unit_price)*(num(x.vat_rate)/100),0);
  const docType=txt(b.document_type)||"angebot";
  const docDate=txt(b.document_date)||new Date().toISOString().slice(0,10);
  const documentNumber=txt(b.document_number);

  const queries:any[]=[
    sql`UPDATE documents SET
      document_type=${docType},
      document_number=${documentNumber},
      document_date=${docDate}::date,
      title=${txt(b.title)},
      status=${txt(b.status)||"entwurf"},
      net_total=${net},vat_total=${vat},gross_total=${net+vat},
      reverse_charge=${reverseCharge},
      service_period_from=${txt(b.service_period_from)}::date,
      service_period_to=${txt(b.service_period_to)}::date,
      delivery_name=${txt(b.delivery_name)},
      delivery_street=${txt(b.delivery_street)},
      delivery_postal_code=${txt(b.delivery_postal_code)},
      delivery_city=${txt(b.delivery_city)},
      updated_at=now()
    WHERE id=${id}`,
    sql`DELETE FROM document_items WHERE document_id=${id}`
  ];

  let n=1;
  for(const x of items){
    queries.push(sql`INSERT INTO document_items(
        document_id,position_no,category,description,quantity,unit,unit_price,vat_rate,line_total,source_type,sort_order
      ) VALUES(
        ${id},${String(n)},${txt(x.category)},${txt(x.description)},${num(x.quantity)},
        ${txt(x.unit)},${num(x.unit_price)},
        ${x.vat_rate===null||x.vat_rate===undefined||x.vat_rate===""?19:num(x.vat_rate)},
        ${num(x.quantity)*num(x.unit_price)},${txt(x.source_type)||"catalog"},${n}
      )`);
    n++
  }
  await sql.transaction(queries);

  if(documentNumber){
    await syncManualNumber(sql,companyId,docType==="rechnung"?"invoice":"offer",docDate,documentNumber)
  }
  return Response.json({ok:true})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Dokument konnte nicht aktualisiert werden."},{status:500})}
}
