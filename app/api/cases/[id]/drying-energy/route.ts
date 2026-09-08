import {getSql} from "@/lib/db";
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,sql=getSql();
  const rows=await sql`SELECT d.id,d.room,d.installed_at,d.removed_at,d.drying_method,d.notes,
    d.runtime_days_override,d.power_kw_override,d.consumption_kwh_override,
    e.equipment_code,e.name equipment_name,e.power_watts,
    CASE WHEN d.runtime_days_override IS NOT NULL THEN d.runtime_days_override
         ELSE GREATEST(0.01,EXTRACT(EPOCH FROM (COALESCE(d.removed_at,now())-d.installed_at))/86400.0) END runtime_days,
    CASE WHEN d.power_kw_override IS NOT NULL THEN d.power_kw_override
         WHEN e.power_watts IS NOT NULL THEN e.power_watts/1000.0 ELSE NULL END power_kw
   FROM drying_installations d LEFT JOIN equipment e ON e.id=d.equipment_id
   WHERE d.case_id=${id} ORDER BY d.installed_at,e.name`;
  const out=rows.map((x:any)=>{
    const days=Number(x.runtime_days||0),kw=x.power_kw==null?null:Number(x.power_kw);
    const calc=kw==null?null:days*24*kw;
    return {...x,runtime_days:days,power_kw:kw,calculated_kwh:x.consumption_kwh_override!=null?Number(x.consumption_kwh_override):calc}
  });
  const total=out.reduce((s:any,x:any)=>s+(Number(x.calculated_kwh)||0),0);
  return Response.json({items:out,total_kwh:total})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Verbrauch konnte nicht berechnet werden."},{status:500})}
}
