import {getSql} from "@/lib/db";
export async function GET(request:Request){
 try{
  const userId=request.headers.get("x-app-user-id");
  if(!userId)return Response.json({error:"Nicht angemeldet."},{status:401});
  const sql=getSql();
  const rows=await sql`SELECT c.id,c.code,c.name,c.legal_name,c.street,c.postal_code,c.city,c.phone,c.mobile,c.email,
      c.tax_number,c.vat_id,c.iban,c.bic,c.bank_name,c.logo_url,c.letterhead_json,c.footer_json
    FROM companies c
    JOIN app_user_companies auc ON auc.company_id=c.id AND auc.user_id=${userId}
    ORDER BY CASE WHEN c.code='ERHARD' THEN 1 WHEN c.code='DRYLAND' THEN 2 ELSE 3 END,c.name`;
  return Response.json(rows)
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Firmen konnten nicht geladen werden."},{status:500})}
}
