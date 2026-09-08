"use client";
import {useEffect,useState} from "react";
import * as XLSX from "xlsx";

function n(v:any){if(v===null||v===undefined||v==="")return 0;const x=Number(String(v).replace(",", "."));return Number.isFinite(x)?x:0}
export default function ArticleCatalog(){
 const[q,setQ]=useState(""),[cat,setCat]=useState("own"),[rows,setRows]=useState<any[]>([]),[msg,setMsg]=useState(""),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch(`/api/articles?q=${encodeURIComponent(q)}&catalog=${cat}&limit=100`,{cache:"no-store"});const j=await r.json();if(r.ok)setRows(j);else setErr(j.error||"Fehler")}
 useEffect(()=>{const t=setTimeout(load,180);return()=>clearTimeout(t)},[q,cat]);
 async function importExcel(file:File){
  setBusy(true);setErr("");setMsg("");
  try{
   const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:"array"});
   const out:any[]=[];
   const own=wb.Sheets["Gesamtkatalog (eigene)"];
   if(own){
    const a:any[][]=XLSX.utils.sheet_to_json(own,{header:1,defval:"",raw:false});
    for(let i=4;i<a.length;i++){const r=a[i];if(!String(r[1]||"").trim())continue;out.push({catalog:"own",article_number:String(r[0]||"").trim(),name:String(r[1]||"").trim(),description:String(r[1]||"").trim(),unit:String(r[2]||"").trim(),unit_price:n(r[4]||r[3]),source:`Excel-Import · ${String(r[6]||"Eigene Leistungen").trim()}`})}
   }
   const axa=wb.Sheets["AXA-Leistungsverzeichnis"];
   if(axa){
    const a:any[][]=XLSX.utils.sheet_to_json(axa,{header:1,defval:"",raw:false});
    let group="";
    for(let i=4;i<a.length;i++){const r=a[i],code=String(r[0]||"").trim(),name=String(r[3]||"").trim();if(code&&!name){group=code;continue}if(!code||!name)continue;out.push({catalog:"axa",article_number:code,name,description:String(r[6]||name).trim(),unit:String(r[4]||"").trim(),unit_price:n(r[7]||r[5]),source:`Excel-Import AXA${group?` · ${group}`:""}`})}
   }
   if(!out.length)throw new Error("Die erwarteten Tabellenblätter wurden nicht gefunden.");
   const resp=await fetch("/api/articles/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows:out})});const j=await resp.json();
   if(!resp.ok)throw new Error(j.error||"Import fehlgeschlagen.");
   setMsg(`${j.count} Artikel wurden aus Excel übernommen. Schadensbericht wurde als Standardleistung ergänzt.`);await load()
  }catch(e){setErr(e instanceof Error?e.message:"Excel konnte nicht importiert werden.")}finally{setBusy(false)}
 }
 return <div className="card">
  <div className="sectionHeader"><div><h2>Artikelliste</h2><p className="muted small">Eigene Leistungen und AXA-Positionen können direkt aus deiner Excel-Artikelliste aktualisiert werden.</p></div>
   <label className="button secondary" style={{cursor:"pointer"}}>{busy?"Import läuft …":"Excel-Artikelliste importieren"}<input type="file" accept=".xlsx,.xls" hidden disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)importExcel(f);e.currentTarget.value=""}}/></label>
  </div>
  {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
  <div className="formGrid"><div className="field"><label>Katalog</label><select value={cat} onChange={e=>setCat(e.target.value)}><option value="own">Eigene Leistungen</option><option value="axa">AXA</option><option value="all">Alle</option></select></div><div className="field"><label>Suche</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="z. B. Schadensbericht, Leckageortung, Trocknung"/></div></div>
  <div className="tableWrap" style={{marginTop:12}}><table className="simpleTable"><thead><tr><th>Nr.</th><th>Leistung</th><th>Einheit</th><th>Preis</th><th>Quelle</th></tr></thead><tbody>{rows.map((a:any,i:number)=><tr key={`${a.catalog}-${a.article_number}-${i}`}><td>{a.article_number}</td><td>{a.name}<br/><span className="muted small">{a.description!==a.name?a.description:""}</span></td><td>{a.unit}</td><td>{a.unit_price!=null?Number(a.unit_price).toFixed(2)+" €":"n. Nachweis"}</td><td>{a.source}</td></tr>)}</tbody></table></div>
 </div>
}
