import {requestOwnerId} from "@/lib/organization";

export const runtime="nodejs";
function extractText(data:any){
  if(typeof data?.output_text==="string")return data.output_text;
  const chunks:string[]=[];for(const item of data?.output||[])for(const c of item?.content||[])if(c?.type==="output_text"&&typeof c.text==="string")chunks.push(c.text);
  return chunks.join("\n");
}
export async function POST(request:Request){
  try{
    requestOwnerId(request);const key=process.env.OPENAI_API_KEY;
    if(!key)return Response.json({error:"OPENAI_API_KEY ist noch nicht eingerichtet."},{status:503});
    const body=await request.json();if(typeof body.image!=="string"||!body.image.startsWith("data:image/"))return Response.json({error:"Bitte ein Foto oder Bild auswählen."},{status:400});
    const instruction=`Lies dieses deutsche Dokument (z. B. Versicherungspolice, Beitragsrechnung, Fahrzeug- oder Haushaltsrechnung) sorgfältig aus. Antworte ausschließlich als valides JSON mit diesem Schema: {"document_type":"insurance|invoice|vehicle|contract|other","title":"","issuer":"","policy_number":"","amount":null,"due_date":"YYYY-MM-DD oder null","interval_months":null,"category":"","notes":"","confidence":"high|medium|low"}. Betrag in Euro als Zahl. interval_months ist der Zahlungsrhythmus (1,3,6,12). Nichts erfinden; unlesbare Werte leer oder null lassen.`;
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",input:[{role:"user",content:[{type:"input_text",text:instruction},{type:"input_image",image_url:body.image}]}]})});
    const data=await response.json();if(!response.ok)return Response.json({error:data?.error?.message||"Dokumentanalyse fehlgeschlagen."},{status:502});
    const raw=extractText(data).trim().replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim();
    return Response.json({ok:true,result:JSON.parse(raw),requires_confirmation:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Dokumentanalyse fehlgeschlagen."},{status:500})}
}
