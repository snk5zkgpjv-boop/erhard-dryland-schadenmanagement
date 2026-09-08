import {NextResponse} from "next/server";

type ExtractedItem={
  title?:string;
  description?:string;
  quantity?:number;
  unit?:string;
  category?:string;
  search_terms?:string[];
  confidence?:number;
  note?:string;
};

function jsonFromText(text:string){
  const cleaned=text.trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
  const a=cleaned.indexOf("{"),b=cleaned.lastIndexOf("}");
  if(a<0||b<a) throw new Error("Die KI-Antwort enthielt kein auswertbares JSON.");
  return JSON.parse(cleaned.slice(a,b+1));
}

export async function POST(req:Request){
  try{
    const key=process.env.OPENAI_API_KEY;
    if(!key) return NextResponse.json({error:"OPENAI_API_KEY ist nicht konfiguriert."},{status:503});

    const form=await req.formData();
    const files=form.getAll("images").filter((x):x is File=>x instanceof File);
    const context=String(form.get("context")||"").trim();

    if(!files.length) return NextResponse.json({error:"Bitte mindestens ein Foto auswählen."},{status:400});
    if(files.length>6) return NextResponse.json({error:"Maximal 6 Bilder pro Analyse."},{status:400});

    const images:any[]=[];
    for(const f of files){
      if(!/^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type||"")){
        return NextResponse.json({error:`Nicht unterstützter Bildtyp: ${f.type||f.name}`},{status:400});
      }
      if(f.size>10*1024*1024) return NextResponse.json({error:`${f.name}: maximal 10 MB pro Bild.`},{status:400});
      const buf=Buffer.from(await f.arrayBuffer());
      images.push({type:"input_image",image_url:`data:${f.type||"image/jpeg"};base64,${buf.toString("base64")}`});
    }

    const prompt=`Du arbeitest für einen deutschen Handwerksbetrieb (Sanierung, Trocknung, Maler-, Putz- und Renovierungsarbeiten).
Analysiere die Fotos von handschriftlichen Baustellennotizen, Aufmaßen oder Kundennotizen und erstelle ausschließlich einen strukturierten ANGEBOTSENTWURF.

WICHTIGE REGELN:
- Nichts erfinden. Unsichere Wörter, Maße oder Zuordnungen ausdrücklich als unsicher markieren.
- Kunde, Leistungsort und Rechnungsanschrift nur aus dem Bild oder dem Zusatzkontext übernehmen.
- Kunde und Leistungsort getrennt halten.
- Aus Maßen nur dann Mengen berechnen, wenn die Rechenlogik eindeutig ist.
- Wiederholungen wie "4x 1,50 x 1,00 m" als 6,00 m² berechnen.
- Wenn ein Zusatz wie 40-50 mm Putzaufbau erkennbar ist, als eigene Zusatzleistung beschreiben.
- Keine erfundenen Einheitspreise. unit_price_suggestion immer null lassen.
- Für jede Leistung 1-4 kurze deutsche Suchbegriffe erzeugen, mit denen im vorhandenen Artikelkatalog gesucht werden kann.
- Positionen fachlich formulieren, aber eng an den Notizen bleiben.
- Gib NUR gültiges JSON zurück.

JSON-Schema:
{
 "customer":{"name":"","company":"","street":"","postal_code":"","city":"","phone":"","email":"","confidence":0},
 "delivery":{"name":"","street":"","postal_code":"","city":"","confidence":0},
 "project_note":"",
 "items":[
   {
    "title":"",
    "description":"",
    "quantity":0,
    "unit":"m²|Stk.|Pausch.|lfm|Std.",
    "category":"",
    "search_terms":[],
    "unit_price_suggestion":null,
    "confidence":0,
    "note":""
   }
 ],
 "uncertainties":[""],
 "recognized_text_summary":""
}

Zusatzkontext des Nutzers:
${context||"(kein Zusatzkontext)"}`;

    const content:any[]=[{type:"input_text",text:prompt},...images];
    const resp=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.OPENAI_VISION_MODEL||"gpt-5.6-luna",
        input:[{role:"user",content}],
        max_output_tokens:5000
      })
    });

    const raw=await resp.json();
    if(!resp.ok) return NextResponse.json({error:raw?.error?.message||"OpenAI-Bildanalyse fehlgeschlagen."},{status:502});

    const text=raw.output_text ||
      (Array.isArray(raw.output)?raw.output.flatMap((o:any)=>o.content||[]).map((c:any)=>c.text||"").join(""):"");
    const result=jsonFromText(text||"");

    const items=(Array.isArray(result.items)?result.items:[]).map((x:ExtractedItem)=>({
      title:String(x.title||"").trim(),
      description:String(x.description||"").trim(),
      quantity:Number(x.quantity)||0,
      unit:String(x.unit||"").trim()||"Stk.",
      category:String(x.category||"").trim()||"Sonstige Leistungen",
      search_terms:Array.isArray(x.search_terms)?x.search_terms.map(String).filter(Boolean).slice(0,4):[],
      unit_price_suggestion:null,
      confidence:Math.max(0,Math.min(1,Number(x.confidence)||0)),
      note:String(x.note||"").trim()
    }));

    return NextResponse.json({...result,items});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Fotoanalyse fehlgeschlagen."},{status:500});
  }
}
