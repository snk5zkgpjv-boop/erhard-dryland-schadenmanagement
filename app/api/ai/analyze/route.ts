export const runtime="nodejs";
function extractText(data:any){
  if(typeof data?.output_text==="string") return data.output_text;
  const chunks:string[]=[];
  for(const item of data?.output||[]) for(const c of item?.content||[]) if(c?.type==="output_text"&&typeof c.text==="string") chunks.push(c.text);
  return chunks.join("\n");
}
function parseJson(text:string){
  const cleaned=text.trim().replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim();
  return JSON.parse(cleaned);
}
export async function POST(r:Request){
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) return Response.json({error:"OPENAI_API_KEY ist in Vercel noch nicht hinterlegt."},{status:503});
  try{
    const b=await r.json();
    const task=String(b.task||"photo_description");
    const image=typeof b.image==="string"?b.image:null;
    const context=typeof b.context==="string"?b.context:"";
    let instruction="";
    if(task==="equipment"){
      instruction=`Analysiere das Foto eines Trocknungs- oder Baustellengeräts bzw. Typenschilds. Gib ausschließlich valides JSON zurück:
{"name":"","manufacturer":"","model":"","serial_number":"","power_watts":null,"equipment_type":"technical|insulation|universal","equipment_code_suggestion":"","notes":"","confidence":"hoch|mittel|niedrig"}
Erfinde nichts. Nicht lesbare Werte als leere Zeichenfolge oder null. equipment_type: technical=technische Trocknung, insulation=Dämmschichttrocknung, universal=beides.`;
    }else if(task==="article_match"){
      instruction=`Ordne die folgende Leistungsbeschreibung den wahrscheinlich passenden Artikeln zu. Antworte ausschließlich als valides JSON:
{"search_terms":["..."],"summary":"..."}
Formuliere präzise Suchbegriffe für einen deutschen Handwerker-/Trocknungs-Leistungskatalog. Kontext: ${context}`;
    }else{
      instruction=`Erstelle für ein professionelles deutsches Schadensprotokoll eine sachliche, kurze Bildbeschreibung. Keine Spekulation über verdeckte Ursachen. Antworte ausschließlich als valides JSON:
{"description":"","room":"","component":"","damage_observation":"","confidence":"hoch|mittel|niedrig"}
Kontext: ${context}`;
    }
    const content:any[]=[{type:"input_text",text:instruction}];
    if(image)content.push({type:"input_image",image_url:image});
    const resp=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",input:[{role:"user",content}]})
    });
    const data=await resp.json();
    if(!resp.ok) return Response.json({error:data?.error?.message||"OpenAI-Anfrage fehlgeschlagen."},{status:502});
    const text=extractText(data);
    try{return Response.json({ok:true,result:parseJson(text)})}
    catch{return Response.json({ok:true,result:{description:text}})}
  }catch(e){return Response.json({error:e instanceof Error?e.message:"KI-Analyse fehlgeschlagen."},{status:500})}
}
