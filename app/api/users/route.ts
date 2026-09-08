import {headers} from "next/headers";import {ensureAuthSchema,hashPassword} from "@/lib/auth";import {getSql} from "@/lib/db";
async function admin(){const h=await headers();return h.get("x-app-role")==="admin"}

export async function GET(){
 if(!await admin())return Response.json({error:"Nur Admin."},{status:403});
 await ensureAuthSchema();const sql=getSql();
 const rows=await sql`SELECT u.id,u.username,u.display_name,u.email,u.role,u.active,u.created_at,
   COALESCE(json_agg(json_build_object('id',c.id,'code',c.code,'name',c.name)) FILTER (WHERE c.id IS NOT NULL),'[]'::json) AS companies
   FROM app_users u
   LEFT JOIN app_user_companies auc ON auc.user_id=u.id
   LEFT JOIN companies c ON c.id=auc.company_id
   GROUP BY u.id ORDER BY u.display_name`;
 return Response.json(rows)
}

export async function POST(r:Request){
 if(!await admin())return Response.json({error:"Nur Admin."},{status:403});
 try{
  const b=await r.json();const username=String(b.username||"").trim(),display=String(b.display_name||"").trim(),password=String(b.password||""),role=String(b.role||"techniker");
  const companyIds=Array.isArray(b.company_ids)?b.company_ids.map(String).filter(Boolean):[];
  if(!username||!display||password.length<8||!["admin","techniker","buero"].includes(role)||companyIds.length===0)return Response.json({error:"Bitte Pflichtfelder und mindestens eine Firma auswählen."},{status:400});
  const sql=getSql();
  const rows=await sql`INSERT INTO app_users(username,display_name,email,role,password_hash) VALUES(${username},${display},${String(b.email||"").trim()||null},${role},${hashPassword(password)}) RETURNING id`;
  const userId=rows[0].id as string;
  for(const companyId of companyIds)await sql`INSERT INTO app_user_companies(user_id,company_id) VALUES(${userId},${companyId}) ON CONFLICT DO NOTHING`;
  return Response.json({id:userId},{status:201})
 }catch(e:any){return Response.json({error:String(e?.message||"Benutzer konnte nicht angelegt werden.").includes("app_users_username_lower_uq")?"Benutzername ist bereits vergeben.":(e?.message||"Benutzer konnte nicht angelegt werden.")},{status:500})}
}
