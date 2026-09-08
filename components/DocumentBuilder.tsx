"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import Link from "next/link";
type Article={catalog:string;article_number:string;name:string;description:string;unit:string;unit_price:number|null;source:string;note?:string};
type Item={description:string;quantity:number;unit:string;unit_price:number;vat_rate:number;category?:string;source_type?:string};

export default function DocumentBuilder({caseId="",documentId="",initialType="angebot",sourceDocumentId=""}:{caseId?:string;documentId?:string;initialType?:string;sourceDocumentId?:string}){
 const[caseData,setCaseData]=useState<any>(null),[doc,setDoc]=useState<any>(null),[items,setItems]=useState<Item[]>([]),[q,setQ]=useState(""),[catalog,setCatalog]=useState("own"),[results,setResults]=useState<Article[]>([]),[msg,setMsg]=useState(""),[err,setErr]=useState(""),[aiText,setAiText]=useState(""),[suggestions,setSuggestions]=useState<any>(null);
 useEffect(()=>{(async()=>{try{
   if(documentId){const r=await fetch(`/api/documents/${documentId}`,{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error);setDoc(d);setCaseData(d);setItems((d.items||[]).map((x:any)=>({description:x.description,quantity:Number(x.quantity),unit:x.unit||"",unit_price:Number(x.unit_price),vat_rate:Number(x.vat_rate),category:x.category||"",source_type:x.source_type||"catalog"})))}
   else if(caseId){const r=await fetch(`/api/cases/${caseId}`,{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error);setCaseData(d)}
   if(sourceDocumentId&&!documentId){const r=await fetch(`/api/documents/${sourceDocumentId}`,{cache:"no-store"}),s=await r.json();if(r.ok){setItems((s.items||[]).map((x:any)=>({description:x.description,quantity:Number(x.quantity),unit:x.unit||"",unit_price:Number(x.unit_price),vat_rate:Number(x.vat_rate),category:x.category||"",source_type:"source_offer"})));setMsg(`Positionen aus Angebot ${s.document_number||""} übernommen.`)}}
   if(caseId){const r=await fetch(`/api/cases/${caseId}/billing-suggestions`,{cache:"no-store"});if(r.ok)setSuggestions(await r.json())}
 }catch(e){setErr(e instanceof Error?e.message:"Fehler")}})()},[caseId,documentId,sourceDocumentId]);

 useEffect(()=>{const t=setTimeout(async()=>{if(!q.trim()){setResults([]);return}const r=await fetch(`/api/articles?q=${encodeURIComponent(q)}&catalog=${catalog}&limit=30`);if(r.ok)setResults(await r.json())},220);return()=>clearTimeout(t)},[q,catalog]);
 const net=useMemo(()=>items.reduce((s,x)=>s+(Number(x.quantity)||0)*(Number(x.unit_price)||0),0),[items]),vat=useMemo(()=>items.reduce((s,x)=>s+(Number(x.quantity)||0)*(Number(x.unit_price)||0)*((Number(x.vat_rate)||0)/100),0),[items]);

 function addArticle(a:Article){setItems(v=>[...v,{description:`${a.article_number} ${a.name}${a.description&&a.description!==a.name?" – "+a.description:""}`,quantity:1,unit:a.unit||"Stk.",unit_price:Number(a.unit_price||0),vat_rate:19,category:a.source,source_type:a.catalog}])}
 function addFree(){setItems(v=>[...v,{description:"Freie Position",quantity:1,unit:"Pauschale",unit_price:0,vat_rate:19,source_type:"manual"}])}
 function patch(i:number,k:keyof Item,v:any){setItems(arr=>arr.map((x,n)=>n===i?{...x,[k]:["quantity","unit_price","vat_rate"].includes(k as string)?Number(v):v}:x))}
 async function fromCase(){if(!suggestions&&caseId){const r=await fetch(`/api/cases/${caseId}/billing-suggestions`);if(r.ok)setSuggestions(await r.json())}const s=suggestions;if(!s)return;setQ((s.search_terms||[]).join(" "));setAiText(s.context||"");setMsg("Schadendaten ausgewertet. Suchbegriffe und Trocknungspositionen stehen bereit.")}
 function addDryingSuggestions(){
  const s=suggestions?.suggested_items||[];if(!s.length){setErr("Im Schaden sind noch keine Trocknungsgeräte hinterlegt.");return}
  setItems(v=>[...v,...s.map((x:any)=>({description:x.description,quantity:Number(x.quantity)||1,unit:x.unit||"Tage",unit_price:0,vat_rate:19,category:"Trocknung",source_type:"drying"}))]);
  setMsg(`${s.length} Trocknungsposition(en) übernommen. Bitte Preis(e) prüfen bzw. aus dem Katalog übernehmen.`)
 }
 function applyActualDrying(){
  const s=suggestions?.suggested_items||[];if(!s.length){setErr("Keine tatsächlichen Trocknungsdaten vorhanden.");return}
  const oldDry=items.filter(x=>/trocknung/i.test(x.description)),price=oldDry.find(x=>Number(x.unit_price)>0)?.unit_price||0;
  const keep=items.filter(x=>!/trocknung/i.test(x.description));
  setItems([...keep,...s.map((x:any)=>({description:x.description,quantity:Number(x.quantity)||1,unit:"Tage",unit_price:price,vat_rate:19,category:"Trocknung",source_type:"drying_actual"}))]);
  setMsg(`Tatsächliche Laufzeiten aus dem Schaden übernommen${price?` – Angebotspreis ${price.toFixed(2)} € je Einheit beibehalten`:""}.`)
 }
 async function aiSuggest(){if(!aiText.trim())return;const r=await fetch("/api/ai/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task:"article_match",context:aiText})}),j=await r.json();if(!r.ok){setErr(j.error||"KI nicht verfügbar.");return}setQ((j.result?.search_terms||[]).join(" ")||aiText)}
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setErr("");const f=new FormData(e.currentTarget),body:any=Object.fromEntries(f.entries());body.case_id=caseId||doc?.case_id||null;body.company_id=caseData?.company_id||doc?.company_id;body.items=items;const url=documentId?`/api/documents/${documentId}`:"/api/documents",r=await fetch(url,{method:documentId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),j=await r.json();if(!r.ok){setErr(j.error||"Speichern fehlgeschlagen.");return}const id=documentId||j.id;if(id)location.href=`/documents/${id}/view`}

 const customerName=doc?.customer_company_name||[doc?.first_name,doc?.last_name].filter(Boolean).join(" ")||caseData?.customer_name||"";
 const deliveryName=doc?.delivery_name||caseData?.title||customerName||"",deliveryStreet=doc?.delivery_street||caseData?.object_street||doc?.object_street||"",deliveryPostal=doc?.delivery_postal_code||caseData?.object_postal_code||doc?.object_postal_code||"",deliveryCity=doc?.delivery_city||caseData?.object_city||doc?.object_city||"";
 const type=doc?.document_type||initialType;

 return <>
  <div className="topbar"><Link className="back" href={caseId?`/cases/${caseId}`:"/"}>← Zurück</Link>{documentId&&<Link className="button secondary" href={`/documents/${documentId}/view`}>Dokumentansicht</Link>}</div>
  <section className="hero"><span className="pill">Dokumenteditor</span><h1>{documentId?"Dokument bearbeiten":type==="rechnung"?"Rechnung erstellen":"Angebot erstellen"}</h1>{sourceDocumentId&&<p className="muted">Grundlage: vorhandenes Angebot. Für die Rechnung können tatsächliche Trocknungslaufzeiten übernommen werden.</p>}</section>
  {err&&<div className="error">{err}</div>}{msg&&<div className="notice">{msg}</div>}
  <section className="grid cols2 section">
   <div className="card"><h2>Leistungen aus Schaden</h2>{caseId&&<div className="actions"><button type="button" className="button secondary" onClick={fromCase}>Schaden auswerten</button>{suggestions?.suggested_items?.length>0&&<button type="button" className="button secondary" onClick={addDryingSuggestions}>Trocknungspositionen übernehmen</button>}{type==="rechnung"&&suggestions?.suggested_items?.length>0&&<button type="button" className="button" onClick={applyActualDrying}>Tatsächliche Trocknung anwenden</button>}</div>}
    {suggestions?.suggested_items?.length>0&&<div className="notice" style={{marginTop:10}}>Erkannt: {suggestions.suggested_items.length} Trocknungsgerät(e), berechneter Verbrauch ca. {Number(suggestions.total_consumption_kwh||0).toLocaleString("de-DE",{maximumFractionDigits:1})} kWh.</div>}
    <div className="divider"/><h2>Artikel finden</h2><div className="field"><label>Leistung frei beschreiben (KI)</label><textarea value={aiText} onChange={e=>setAiText(e.target.value)}/></div><button className="button secondary" type="button" onClick={aiSuggest}>KI: passende Suchbegriffe</button>
    <div className="formGrid" style={{marginTop:9}}><div className="field"><label>Katalog</label><select value={catalog} onChange={e=>setCatalog(e.target.value)}><option value="own">Eigener Katalog</option><option value="axa">AXA</option><option value="all">Alle</option></select></div><div className="field"><label>Artikelsuche</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="z. B. Technische Trocknung"/></div></div>
    <div style={{maxHeight:360,overflow:"auto"}}>{results.map((a,i)=><div key={`${a.catalog}${a.article_number}${i}`} className="checkRow"><div style={{flex:1}}><strong>{a.article_number} · {a.name}</strong><div className="caseMeta">{a.unit} · {Number(a.unit_price||0).toFixed(2)} €<br/>{a.source}</div></div><button className="button secondary smallButton" type="button" onClick={()=>addArticle(a)}>Übernehmen</button></div>)}</div><button className="button secondary" type="button" onClick={addFree}>+ freie Position</button>
   </div>

   <form className="card" onSubmit={save}><h2>Dokument</h2>
    <div className="formGrid"><div className="field"><label>Art</label><select name="document_type" defaultValue={type}><option value="angebot">Angebot</option><option value="rechnung">Rechnung</option></select></div><div className="field"><label>Status</label><select name="status" defaultValue={doc?.status||"entwurf"}><option>entwurf</option><option>freigegeben</option><option>versendet</option><option>bezahlt</option><option>storniert</option></select></div><div className="field"><label>Nummer</label><input name="document_number" defaultValue={doc?.document_number||""}/></div><div className="field"><label>Datum</label><input type="date" name="document_date" defaultValue={String(doc?.document_date||new Date().toISOString()).slice(0,10)}/></div><div className="field full"><label>Titel / Betreff</label><input name="title" defaultValue={doc?.title||caseData?.title||caseData?.case_title||""}/></div></div>
    <div className="divider"/><h3>Leistungszeitraum</h3><div className="formGrid"><div className="field"><label>von</label><input type="date" name="service_period_from" defaultValue={String(doc?.service_period_from||"").slice(0,10)}/></div><div className="field"><label>bis</label><input type="date" name="service_period_to" defaultValue={String(doc?.service_period_to||"").slice(0,10)}/></div></div>
    <div className="divider"/><h3>Liefer-/Leistungsadresse</h3><div className="formGrid"><div className="field full"><label>Name / Objekt</label><input name="delivery_name" defaultValue={deliveryName}/></div><div className="field full"><label>Straße / Hausnummer</label><input name="delivery_street" defaultValue={deliveryStreet}/></div><div className="field"><label>PLZ</label><input name="delivery_postal_code" defaultValue={deliveryPostal}/></div><div className="field"><label>Ort</label><input name="delivery_city" defaultValue={deliveryCity}/></div></div>
    <div className="divider"/><h3>Positionen</h3>{items.length===0?<div className="empty">Noch keine Positionen.</div>:items.map((x,i)=><div className="card" style={{marginBottom:8,padding:9}} key={i}><div className="field"><label>Beschreibung</label><textarea value={x.description} onChange={e=>patch(i,"description",e.target.value)}/></div><div className="formGrid"><div className="field"><label>Menge</label><input type="number" step="0.01" value={x.quantity} onChange={e=>patch(i,"quantity",e.target.value)}/></div><div className="field"><label>Einheit</label><input value={x.unit} onChange={e=>patch(i,"unit",e.target.value)}/></div><div className="field"><label>Einzelpreis €</label><input type="number" step="0.01" value={x.unit_price} onChange={e=>patch(i,"unit_price",e.target.value)}/></div><div className="field"><label>USt. %</label><input type="number" step="0.01" value={x.vat_rate} onChange={e=>patch(i,"vat_rate",e.target.value)}/></div></div><button type="button" className="button secondary smallButton" onClick={()=>setItems(a=>a.filter((_,n)=>n!==i))}>Position löschen</button></div>)}
    <div className="divider"/><div style={{textAlign:"right"}}><strong>Netto:</strong> {net.toFixed(2)} €<br/><strong>USt.:</strong> {vat.toFixed(2)} €<br/><strong>Gesamt:</strong> {(net+vat).toFixed(2)} €</div><button className="button success" style={{marginTop:12}}>{documentId?"Speichern & ansehen":"Dokument erstellen & ansehen"}</button>
   </form>
  </section>
 </>
}
