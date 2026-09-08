import {getSql} from "@/lib/db";
function code(s:string){return s.toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"GERAET"}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,sql=getSql();const eq=await sql`SELECT id,equipment_code,name,stock_quantity FROM equipment WHERE id=${id} LIMIT 1`;
  if(!eq.length)return Response.json({error:"Gerätemodell nicht gefunden."},{status:404});
  const stock=Math.max(0,Number(eq[0].stock_quantity)||0);
  let active=await sql`SELECT * FROM equipment_units WHERE equipment_id=${id} AND active=true ORDER BY unit_code`;
  if(active.length<stock){
   const all=await sql`SELECT unit_code FROM equipment_units WHERE equipment_id=${id}`;
   const used=new Set(all.map((x:any)=>String(x.unit_code)));
   let n=1;
   while(active.length<stock){let unit="";do{unit=`${code(String(eq[0].equipment_code||eq[0].name))}-${String(n++).padStart(3,"0")}`}while(used.has(unit));used.add(unit);await sql`INSERT INTO equipment_units(equipment_id,unit_code,serial_number,active) VALUES(${id},${unit},NULL,true)`;active=await sql`SELECT * FROM equipment_units WHERE equipment_id=${id} AND active=true ORDER BY unit_code`}
  }else if(active.length>stock){
   const extra=active.slice(stock).map((x:any)=>x.id);for(const uid of extra)await sql`UPDATE equipment_units SET active=false,updated_at=now() WHERE id=${uid}`
  }
  const rows=await sql`SELECT u.*,m.maintenance_date last_maintenance,m.next_due_date
    FROM equipment_units u LEFT JOIN LATERAL(SELECT maintenance_date,next_due_date FROM equipment_maintenance WHERE equipment_unit_id=u.id ORDER BY maintenance_date DESC,created_at DESC LIMIT 1)m ON true
    WHERE u.equipment_id=${id} AND u.active=true ORDER BY u.unit_code`;
  return Response.json({equipment:eq[0],units:rows})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Einzelgeräte konnten nicht geladen werden."},{status:500})}
}
