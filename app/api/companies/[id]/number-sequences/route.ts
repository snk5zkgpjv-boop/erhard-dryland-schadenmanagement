import {getSql} from "@/lib/db";
const TYPES=["project","offer","invoice","assignment"] as const;
function n(v:any,d=1){const x=Number(v);return Number.isFinite(x)?Math.trunc(x):d}
function t(v:any){return v===null||v===undefined?null:String(v).trim()||null}

async function allowed(request:Request,id:string){
 const userId=request.headers.get("x-app-user-id");
 if(!userId)return {error:Response.json({error:"Nicht angemeldet."},{status:401})};
 const sql=getSql();
 const ok=await sql`SELECT 1 FROM app_user_companies WHERE user_id=${userId} AND company_id=${id} LIMIT 1`;
 if(!ok.length)return {error:Response.json({error:"Keine Berechtigung für diese Firma."},{status:403})};
 return {sql};
}
async function existingCurrent(sql:any,companyId:string,type:string,year:number){
 if(type==="offer"||type==="invoice"){
  const docType=type==="offer"?"angebot":"rechnung";
  const rows=await sql`SELECT COALESCE(MAX(
    CASE WHEN document_number ~ ${`^${year}-[0-9]+$`} THEN split_part(document_number,'-',2)::integer ELSE NULL END
  ),0)::integer n FROM documents WHERE company_id=${companyId} AND document_type=${docType}`;
  return Number(rows[0]?.n||0)
 }
 if(type==="assignment"){
  const rows=await sql`SELECT COALESCE(MAX(
    CASE WHEN assignment_number ~ ${`^AE-${year}-[0-9]+$`} THEN split_part(assignment_number,'-',3)::integer ELSE NULL END
  ),0)::integer n FROM assignments WHERE company_id=${companyId}`;
  return Number(rows[0]?.n||0)
 }
 const rows=await sql`SELECT COALESCE(MAX(
   CASE WHEN case_number ~ ${`^${year}-[0-9]+$`} THEN split_part(case_number,'-',2)::integer ELSE NULL END
 ),0)::integer n FROM cases WHERE company_id=${companyId}`;
 return Number(rows[0]?.n||0)
}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,a=await allowed(request,id);if(a.error)return a.error;const sql:any=a.sql;
  const rows=await sql`SELECT sequence_type,sequence_year,start_value,current_value,prefix,number_width,format_pattern
    FROM number_sequences WHERE company_id=${id} ORDER BY sequence_year DESC,sequence_type`;
  return Response.json(rows)
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Nummernkreise konnten nicht geladen werden."},{status:500})}
}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(request.headers.get("x-app-role")!=="admin")return Response.json({error:"Nur Admin-Benutzer dürfen Nummernkreise ändern."},{status:403});
  const{id}=await params,a=await allowed(request,id);if(a.error)return a.error;const sql:any=a.sql;
  const body=await request.json(),rows=Array.isArray(body?.sequences)?body.sequences:[];
  for(const x of rows){
   const type=String(x.sequence_type||"");
   if(!TYPES.includes(type as any))continue;
   const year=n(x.sequence_year,0),start=Math.max(0,n(x.start_value,1)),width=Math.min(12,Math.max(1,n(x.number_width,3)));
   if(year<2000||year>2100)continue;
   const prefix=t(x.prefix),pattern=t(x.format_pattern)||(type==="assignment"?"{PREFIX}-{YEAR}-{NUMBER}":"{YEAR}-{NUMBER}");
   const found=await existingCurrent(sql,id,type,year);
   const initial=Math.max(found,start-1);
   await sql`
    INSERT INTO number_sequences(company_id,sequence_type,sequence_year,start_value,current_value,prefix,number_width,format_pattern)
    VALUES(${id},${type},${year},${start},${initial},${prefix},${width},${pattern})
    ON CONFLICT(company_id,sequence_type,sequence_year) DO UPDATE SET
      start_value=EXCLUDED.start_value,
      current_value=GREATEST(number_sequences.current_value,${found}),
      prefix=EXCLUDED.prefix,number_width=EXCLUDED.number_width,
      format_pattern=EXCLUDED.format_pattern,updated_at=now()`;
  }
  return Response.json({ok:true})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Nummernkreise konnten nicht gespeichert werden."},{status:500})}
}
