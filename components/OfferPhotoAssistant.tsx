"use client";
import {useState} from "react";

type DraftItem={
 title:string;description:string;quantity:number;unit:string;category:string;
 search_terms:string[];confidence:number;note?:string
};
type Draft={
 customer?:any;delivery?:any;project_note?:string;items?:DraftItem[];
 uncertainties?:string[];recognized_text_summary?:string
};
type OfferItem={description:string;quantity:number;unit:string;unit_price:number;vat_rate:number;category?:string;source_type?:string};

export default function OfferPhotoAssistant({
 onApply,onSearch,onDelivery
}:{
 onApply:(items:OfferItem[])=>void;
 onSearch:(terms:string)=>void;
 onDelivery?:(d:any)=>void;
}){
 const[files,setFiles]=useState<File[]>([]);
 const[context,setContext]=useState("");
 const[draft,setDraft]=useState<Draft|null>(null);
 const[busy,setBusy]=useState(false);
 const[err,setErr]=useState("");

 async function analyze(){
  if(!files.length){setErr("Bitte zuerst mindestens ein Foto auswählen.");return}
  setBusy(true);setErr("");setDraft(null);
  try{
   const fd=new FormData();
   files.forEach(f=>fd.append("images",f));
   fd.append("context",context);
   const r=await fetch("/api/ai/offer-from-images",{method:"POST",body:fd});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||"Analyse fehlgeschlagen.");
   setDraft(j);
   const terms=(j.items||[]).flatMap((x:DraftItem)=>x.search_terms||[]).slice(0,10).join(" ");
   if(terms)onSearch(terms);
  }catch(e){setErr(e instanceof Error?e.message:"Analyse fehlgeschlagen.")}
  finally{setBusy(false)}
 }

 function apply(){
  const xs=(draft?.items||[]).map(x=>({
    description:`${x.title}${x.description&&x.description!==x.title?" – "+x.description:""}`,
    quantity:Number(x.quantity)||1,
    unit:x.unit||"Stk.",
    unit_price:0,
    vat_rate:19,
    category:x.category||"Sonstige Leistungen",
    source_type:"ai_photo"
  }));
  if(xs.length)onApply(xs);
  if(draft?.delivery&&onDelivery)onDelivery(draft.delivery);
 }

 return <section className="card aiPhotoCard">
  <div className="aiPhotoHead">
   <div><span className="pill">KI-Fotoassistent</span><h2>Foto → Angebotsentwurf</h2></div>
  </div>
  <p className="muted">Fotografiere Aufmaß, Baustellennotiz oder handschriftlichen Zettel. Die KI liest Leistungen und Maße aus. Preise werden bewusst nicht erfunden, sondern anschließend aus deinem Artikelkatalog übernommen bzw. von dir festgelegt.</p>
  <div className="field"><label>Fotos auswählen</label><input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,6))}/><small>{files.length?`${files.length} Bild(er) ausgewählt`:"Bis zu 6 Bilder"}</small></div>
  <div className="field"><label>Zusatzhinweise (optional)</label><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="z. B. Kunde Baumhauer; Leistungsort Pizza SANREMO; 4 Nischen à 1,50 × 1,00 m; Eckventilbereich 0,80 × 1,00 m mit 40–50 mm Putzaufbau"/></div>
  <button type="button" className="button" disabled={busy||!files.length} onClick={analyze}>{busy?"Bilder werden ausgewertet …":"Fotos auswerten"}</button>
  {err&&<div className="error" style={{marginTop:10}}>{err}</div>}
  {draft&&<div className="aiDraft">
    {(draft.customer?.name||draft.customer?.company||draft.delivery?.name)&&<div className="aiInfoGrid">
      <div><strong>Erkannter Kunde</strong><br/>{draft.customer?.company||draft.customer?.name||"–"}<br/><span className="muted">{[draft.customer?.street,draft.customer?.postal_code,draft.customer?.city].filter(Boolean).join(", ")}</span></div>
      <div><strong>Erkannter Leistungsort</strong><br/>{draft.delivery?.name||"–"}<br/><span className="muted">{[draft.delivery?.street,draft.delivery?.postal_code,draft.delivery?.city].filter(Boolean).join(", ")}</span></div>
    </div>}
    <h3>Erkannte Angebotspositionen</h3>
    {(draft.items||[]).map((x,i)=><div className="aiDraftItem" key={i}>
      <div className="aiDraftTop"><strong>{i+1}. {x.title}</strong><span className="pill">{Math.round((x.confidence||0)*100)} %</span></div>
      <div>{x.description}</div>
      <div className="caseMeta">{Number(x.quantity||0).toLocaleString("de-DE")} {x.unit} · Gruppe: {x.category}</div>
      {x.search_terms?.length>0&&<div className="caseMeta">Katalogsuche: {x.search_terms.join(", ")}</div>}
      {x.note&&<div className="notice" style={{marginTop:6}}>{x.note}</div>}
    </div>)}
    {(draft.uncertainties||[]).length>0&&<div className="notice"><strong>Bitte prüfen:</strong><ul>{draft.uncertainties!.map((u,i)=><li key={i}>{u}</li>)}</ul></div>}
    <div className="actions">
      <button type="button" className="button success" onClick={apply}>Entwurf in Angebot übernehmen</button>
      <button type="button" className="button secondary" onClick={()=>setDraft(null)}>Verwerfen</button>
    </div>
  </div>}
 </section>
}
