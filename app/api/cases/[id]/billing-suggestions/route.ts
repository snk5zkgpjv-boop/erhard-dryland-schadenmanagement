import {getSql} from "@/lib/db";
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params,sql=getSql();
  const [c]=await sql`SELECT damage_description,recommended_action FROM cases WHERE id=${id} LIMIT 1`;
  const drying=await sql`SELECT d.id,d.drying_method,d.notes,d.room,d.installed_at,d.removed_at,
    d.runtime_days_override,d.power_kw_override,d.consumption_kwh_override,
    e.equipment_code,e.name equipment_name,e.power_watts,e.equipment_type
    FROM drying_installations d LEFT JOIN equipment e ON e.id=d.equipment_id WHERE d.case_id=${id} ORDER BY d.installed_at`;
  const reports=await sql`SELECT description,trips_count FROM work_reports WHERE case_id=${id}`;
  const words=["An/Abfahrten","Nachweise auf Stundenbasis"];
  const suggested_items:any[]=[];
  for(const d of drying as any[]){
   const isIns=String(d.drying_method||"").toLowerCase().includes("dämm");
   const term=isIns?"Dämmschichttrocknung":"Technische Trocknung";words.push(term);
   if(isIns)words.push("Verdichter Dämmschicht","Kernlochbohrung");
   if(String(d.notes||"").toLowerCase().includes("folie"))words.push("Folienzelte");
   const natural=Math.max(.01,(new Date(d.removed_at||Date.now()).getTime()-new Date(d.installed_at).getTime())/86400000);
   const days=d.runtime_days_override!=null?Number(d.runtime_days_override):natural;
   const kw=d.power_kw_override!=null?Number(d.power_kw_override):(d.power_watts!=null?Number(d.power_watts)/1000:null);
   const kwh=d.consumption_kwh_override!=null?Number(d.consumption_kwh_override):(kw!=null?kw*days*24:null);
   suggested_items.push({
    source_type:"drying",search_term:term,description:`${term}${d.equipment_name?` – ${d.equipment_name}`:""}${d.room?` (${d.room})`:""}`,
    quantity:Number(days.toFixed(1)),unit:"Tage",unit_price:0,vat_rate:19,equipment_code:d.equipment_code||null,power_kw:kw,consumption_kwh:kwh
   })
  }
  if(reports.length)words.push("Rapportarbeiten");
  const context=[c?.damage_description,c?.recommended_action,...drying.map((d:any)=>`${d.drying_method||""} ${d.equipment_name||""} ${d.notes||""}`),...reports.map((x:any)=>x.description||"")].filter(Boolean).join(" ");
  return Response.json({search_terms:Array.from(new Set(words)),context,suggested_items,total_consumption_kwh:suggested_items.reduce((s,x)=>s+(Number(x.consumption_kwh)||0),0)})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Vorschläge konnten nicht geladen werden."},{status:500})}
}
