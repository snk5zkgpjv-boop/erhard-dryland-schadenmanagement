import {getSql} from "@/lib/db";
function txt(v:any){return v===null||v===undefined?null:String(v).trim()||null}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const userId=request.headers.get("x-app-user-id");if(!userId)return Response.json({error:"Nicht angemeldet."},{status:401});
  const{id}=await params,sql=getSql();
  const rows=await sql`SELECT c.id,c.code,c.name,c.legal_name,c.street,c.postal_code,c.city,c.phone,c.mobile,c.email,
      c.tax_number,c.vat_id,c.iban,c.bic,c.bank_name,c.logo_url,c.letterhead_json,c.footer_json
    FROM companies c JOIN app_user_companies auc ON auc.company_id=c.id AND auc.user_id=${userId}
    WHERE c.id=${id} LIMIT 1`;
  if(!rows.length)return Response.json({error:"Firma nicht gefunden oder keine Berechtigung."},{status:404});
  return Response.json(rows[0])
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Firmendaten konnten nicht geladen werden."},{status:500})}
}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(request.headers.get("x-app-role")!=="admin")return Response.json({error:"Nur Admin-Benutzer dürfen Firmendaten ändern."},{status:403});
  const userId=request.headers.get("x-app-user-id");if(!userId)return Response.json({error:"Nicht angemeldet."},{status:401});
  const{id}=await params,b=await request.json(),sql=getSql();
  const allowed=await sql`SELECT 1 FROM app_user_companies WHERE user_id=${userId} AND company_id=${id} LIMIT 1`;
  if(!allowed.length)return Response.json({error:"Keine Berechtigung für diese Firma."},{status:403});
  const footer=JSON.stringify({
    account_holder:txt(b.account_holder),
    default_editor:txt(b.default_editor),
    website:txt(b.website)
  });
  const rows=await sql`UPDATE companies SET
    name=COALESCE(${txt(b.name)},name),
    legal_name=${txt(b.legal_name)},street=${txt(b.street)},postal_code=${txt(b.postal_code)},city=${txt(b.city)},
    phone=${txt(b.phone)},mobile=${txt(b.mobile)},email=${txt(b.email)},
    tax_number=${txt(b.tax_number)},vat_id=${txt(b.vat_id)},
    iban=${txt(b.iban)},bic=${txt(b.bic)},bank_name=${txt(b.bank_name)},
    logo_url=${txt(b.logo_url)},
    footer_json=COALESCE(footer_json,'{}'::jsonb) || ${footer}::jsonb,
    updated_at=now()
    WHERE id=${id}
    RETURNING id`;
  if(!rows.length)return Response.json({error:"Firma nicht gefunden."},{status:404});
  return Response.json({ok:true})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Firmendaten konnten nicht gespeichert werden."},{status:500})}
}
