import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}
function num(v:unknown){if(v===null||v===undefined||v==="")return null;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:null}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params;const sql=getSql();
  const rows=await sql`
    SELECT id,unit_name,meter_name,
      period_start AS start_date,
      period_end AS end_date,
      start_reading_kwh AS meter_start,
      end_reading_kwh AS meter_end,
      consumption_kwh,
      electricity_price_per_kwh AS price_per_kwh,
      calculated_cost,
      created_at
    FROM energy_records
    WHERE case_id=${id}
    ORDER BY created_at DESC`;
  return Response.json(rows)
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Energiedaten konnten nicht geladen werden."},{status:500})}
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const{id}=await params;const body=await request.json();const sql=getSql();
  const c=await sql`SELECT company_id FROM cases WHERE id=${id} LIMIT 1`;
  if(!c.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});

  const a=num(body.meter_start),b=num(body.meter_end);
  let consumption=num(body.consumption_kwh);
  if(consumption==null&&a!=null&&b!=null)consumption=Math.max(0,b-a);
  const price=num(body.price_per_kwh);
  const cost=consumption!=null&&price!=null?consumption*price:null;

  const rows=await sql`
    INSERT INTO energy_records(
      case_id,company_id,unit_name,meter_name,period_start,period_end,
      start_reading_kwh,end_reading_kwh,consumption_kwh,electricity_price_per_kwh,calculated_cost
    )
    VALUES(
      ${id},${c[0].company_id},${txt(body.unit_name)},${txt(body.meter_name)},
      ${txt(body.start_date)}::date,${txt(body.end_date)}::date,
      ${a},${b},${consumption},${price},${cost}
    )
    RETURNING id`;
  return Response.json({id:rows[0].id},{status:201})
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Energieverbrauch konnte nicht gespeichert werden."},{status:500})}
}
