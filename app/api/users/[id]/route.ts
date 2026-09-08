import {headers} from "next/headers";import {getSql} from "@/lib/db";
async function admin(){const h=await headers();return h.get("x-app-role")==="admin"}
export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 if(!await admin())return Response.json({error:"Nur Admin."},{status:403});
 const{id}=await params;const b=await r.json();const role=String(b.role||"");const active=typeof b.active==="boolean"?b.active:null;
 if(role&&!["admin","techniker","buero"].includes(role))return Response.json({error:"Ungültige Rolle."},{status:400});
 const sql=getSql();
 if(role)await sql`UPDATE app_users SET role=${role},updated_at=now() WHERE id=${id}`;
 if(active!==null)await sql`UPDATE app_users SET active=${active},updated_at=now() WHERE id=${id}`;
 if(Array.isArray(b.company_ids)){
   const ids=b.company_ids.map(String).filter(Boolean);
   if(ids.length===0)return Response.json({error:"Mindestens eine Firma muss zugeordnet sein."},{status:400});
   await sql`DELETE FROM app_user_companies WHERE user_id=${id}`;
   for(const companyId of ids)await sql`INSERT INTO app_user_companies(user_id,company_id) VALUES(${id},${companyId}) ON CONFLICT DO NOTHING`;
 }
 return Response.json({ok:true})
}
