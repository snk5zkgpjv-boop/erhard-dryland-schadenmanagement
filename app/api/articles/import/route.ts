import {getSql} from "@/lib/db";
function text(v:any){return v===null||v===undefined?null:String(v).trim()||null}
function number(v:any){if(v===null||v===undefined||v==="")return 0;const n=Number(String(v).replace(",", "."));return Number.isFinite(n)?n:0}
export async function POST(r:Request){
 if(!["admin","buero"].includes(r.headers.get("x-app-role")||""))return Response.json({error:"Keine Berechtigung."},{status:403});
 try{
  const b=await r.json();const rows=Array.isArray(b.rows)?b.rows:[];const catalogs=Array.from(new Set(rows.map((x:any)=>String(x.catalog||"")).filter((x:string)=>x==="own"||x==="axa")));
  if(!rows.length)return Response.json({error:"Keine Artikel zum Importieren gefunden."},{status:400});
  const sql=getSql();
  for(const c of catalogs)await sql`DELETE FROM articles WHERE category=${c} AND source LIKE 'Excel-Import%'`;
  let count=0;
  for(const x of rows){
   const catalog=String(x.catalog||"own");if(!["own","axa"].includes(catalog))continue;
   const name=text(x.name);if(!name)continue;
   await sql`INSERT INTO articles(company_id,article_number,category,name,description,unit,unit_price,vat_rate,active,source,updated_at)
    VALUES(NULL,${text(x.article_number)},${catalog},${name},${text(x.description)||name},${text(x.unit)},${number(x.unit_price)},19,true,${text(x.source)||`Excel-Import ${catalog}`},now())`;
   count++
  }
  const damage=await sql`SELECT id FROM articles WHERE category='own' AND lower(name)=lower('Schadensbericht') LIMIT 1`;
  if(!damage.length){
   await sql`INSERT INTO articles(company_id,article_number,category,name,description,unit,unit_price,vat_rate,active,source)
    VALUES(NULL,'DR-0001','own','Schadensbericht','Erstellung eines Schadens- und Feuchtigkeitsberichts einschließlich Dokumentation und Fotodokumentation','Pauschale',0,19,true,'Standardleistung')`
  }
  return Response.json({ok:true,count})
 }catch(e){return Response.json({error:e instanceof Error?e.message:"Import fehlgeschlagen."},{status:500})}
}
