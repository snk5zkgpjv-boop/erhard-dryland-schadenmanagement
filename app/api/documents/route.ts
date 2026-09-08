import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){const n=Number(v);return Number.isFinite(n)?n:0}

export async function GET(r:Request){
 try{
  const u=new URL(r.url),caseId=u.searchParams.get("case_id");const sql=getSql();
  const rows=caseId
    ? await sql`SELECT * FROM documents WHERE case_id=${caseId} ORDER BY updated_at DESC`
    : await sql`SELECT d.*,c.title case_title,co.name company_name
        FROM documents d
        LEFT JOIN cases c ON c.id=d.case_id
        JOIN companies co ON co.id=d.company_id
        ORDER BY d.updated_at DESC LIMIT 100`;
  return Response.json(rows)
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Dokumente konnten nicht geladen werden."},{status:500})}
}

export async function POST(r:Request){
 try{
  const b=await r.json(),sql=getSql();
  const items=Array.isArray(b.items)?b.items:[];
  const net=items.reduce((s:any,x:any)=>s+num(x.quantity)*num(x.unit_price),0);
  const vat=items.reduce((s:any,x:any)=>s+num(x.quantity)*num(x.unit_price)*(num(x.vat_rate)/100),0);

  const rows=await sql`
    INSERT INTO documents(
      case_id,company_id,document_type,document_number,document_date,title,status,
      net_total,vat_total,gross_total,reverse_charge,
      service_period_from,service_period_to,
      delivery_name,delivery_street,delivery_postal_code,delivery_city
    )
    VALUES(
      ${txt(b.case_id)},${txt(b.company_id)},${txt(b.document_type)||"angebot"},
      ${txt(b.document_number)},COALESCE(${txt(b.document_date)}::date,CURRENT_DATE),
      ${txt(b.title)},${txt(b.status)||"entwurf"},
      ${net},${vat},${net+vat},${Boolean(b.reverse_charge)},
      ${txt(b.service_period_from)}::date,${txt(b.service_period_to)}::date,
      ${txt(b.delivery_name)},${txt(b.delivery_street)},${txt(b.delivery_postal_code)},${txt(b.delivery_city)}
    )
    RETURNING id`;
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
        ${x.vat_rate===null||x.vat_rate===undefined||x.vat_rate===''?19:num(x.vat_rate)},
        ${num(x.quantity)*num(x.unit_price)},${txt(x.source_type)||"catalog"},${n}
      )`;
    n++
  }
  return Response.json({id},{status:201})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Dokument konnte nicht gespeichert werden."},{status:500})}
}
