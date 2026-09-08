import catalog from "@/data/article-catalog.json";
import {getSql} from "@/lib/db";

type Article={catalog:string;article_number:string;name:string;description:string;unit:string;unit_price:number|null;source:string;note?:string;category?:string;subcategory?:string};
function norm(s:string){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function score(a:Article,q:string){
 if(!q)return 1;
 const words=norm(q).split(/\s+/).filter(Boolean);
 const hay=norm([a.article_number,a.name,a.description,a.category||"",a.subcategory||"",a.source].join(" "));
 let s=0;for(const w of words){if(hay.includes(w))s+=3;if(norm(a.name).includes(w))s+=3;if(norm(a.article_number)===w)s+=8}return s
}
export async function GET(r:Request){
 const u=new URL(r.url),q=(u.searchParams.get("q")||"").trim(),mode=u.searchParams.get("catalog")||"own";
 const limit=Math.min(Number(u.searchParams.get("limit")||40),100);
 try{
  const sql=getSql();
  const dbRows=await sql`SELECT article_number,name,description,unit,unit_price,source,category
    FROM articles WHERE active=true AND (${mode}='all' OR category=${mode})
    ORDER BY article_number NULLS LAST,name LIMIT 1000`;
  if(dbRows.length){
   const rows=dbRows.map((x:any)=>({catalog:x.category||"own",article_number:x.article_number||"",name:x.name,description:x.description||x.name,unit:x.unit||"",unit_price:Number(x.unit_price),source:x.source||"Excel-Import"}));
   return Response.json(rows.map((a:any)=>({a,s:score(a,q)})).filter((x:any)=>x.s>0).sort((a:any,b:any)=>b.s-a.s).slice(0,limit).map((x:any)=>x.a))
  }
 }catch{}
 const rows=(catalog as Article[]).filter(a=>mode==="all"||a.catalog===mode).map(a=>({a,s:score(a,q)})).filter(x=>x.s>0).sort((x,y)=>y.s-x.s).slice(0,limit).map(x=>x.a);
 return Response.json(rows)
}
