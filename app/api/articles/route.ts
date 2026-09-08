import catalog from "@/data/article-catalog.json";

type Article = {
  catalog:string; article_number:string; name:string; description:string; unit:string;
  unit_price:number|null; source:string; note?:string; category?:string; subcategory?:string;
};

function norm(s:string){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function score(a:Article,q:string){
  if(!q) return 1;
  const words=norm(q).split(/\s+/).filter(Boolean);
  const hay=norm([a.article_number,a.name,a.description,a.category||"",a.subcategory||"",a.source].join(" "));
  let s=0;
  for(const w of words){if(hay.includes(w))s+=3;if(norm(a.name).includes(w))s+=3;if(norm(a.article_number)===w)s+=8}
  return s;
}
export async function GET(r:Request){
  const u=new URL(r.url);
  const q=u.searchParams.get("q")||"";
  const mode=u.searchParams.get("catalog")||"own";
  const limit=Math.min(Number(u.searchParams.get("limit")||40),100);
  const rows=(catalog as Article[])
    .filter(a=>mode==="all"||a.catalog===mode)
    .map(a=>({a,s:score(a,q)})).filter(x=>x.s>0).sort((x,y)=>y.s-x.s).slice(0,limit).map(x=>x.a);
  return Response.json(rows);
}
