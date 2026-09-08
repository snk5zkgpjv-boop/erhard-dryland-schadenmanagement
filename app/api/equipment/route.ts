import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){const t=typeof v==="string"?v.trim().replace(",", "."):"";if(!t)return null;const n=Number(t);return Number.isFinite(n)?n:null}

export async function GET(r:Request){
 try{
  const u=new URL(r.url),type=u.searchParams.get("equipment_type"),sql=getSql();
  // Gemeinsamer Gerätekatalog für Erhard und Dryland.
  const rows=await sql`SELECT e.id,e.company_id,e.equipment_code,e.name,e.equipment_type,e.serial_number,e.power_watts,e.active,c.name company_name,c.code company_code
    FROM equipment e JOIN companies c ON c.id=e.company_id
    WHERE e.active=true ORDER BY e.name`;
  return Response.json(type?rows.filter((x:any)=>x.equipment_type===type||x.equipment_type==="universal"):rows)
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Geräte konnten nicht geladen werden."},{status:500})}
}

export async function POST(r:Request){
 if(r.headers.get("x-app-role")!=="admin")return Response.json({error:"Nur Admin-Benutzer dürfen Geräte anlegen."},{status:403});
 try{
  const b=await r.json();const sql=getSql();
  let companyId=txt(b.company_id);
  if(!companyId){
    const owner=await sql`SELECT id FROM companies WHERE code='DRYLAND' ORDER BY id LIMIT 1`;
    companyId=owner[0]?.id as string|null;
  }
  if(!companyId||!txt(b.equipment_code)||!txt(b.name))return Response.json({error:"Gerätenummer und Name sind Pflichtfelder."},{status:400});
  const rows=await sql`INSERT INTO equipment(company_id,equipment_code,name,equipment_type,serial_number,power_watts,active)
    VALUES(${companyId},${txt(b.equipment_code)},${txt(b.name)},${txt(b.equipment_type)||"technical"},${txt(b.serial_number)},${num(b.power_watts)},true) RETURNING id`;
  return Response.json({id:rows[0].id},{status:201})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Gerät konnte nicht gespeichert werden."},{status:500})}
}
