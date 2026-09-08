"use client";
import {useEffect,useMemo,useState} from "react";

type Row={sequence_type:string;sequence_year:number;start_value:number;current_value:number;prefix:string|null;number_width:number;format_pattern:string};
const labels:any={project:"Projekt",offer:"Angebot",invoice:"Rechnung",assignment:"Auftragserteilung"};
const order=["project","offer","invoice","assignment"];
function defaults(year:number,type:string):Row{
 return {sequence_type:type,sequence_year:year,start_value:1,current_value:0,prefix:type==="assignment"?"AE":"",number_width:3,format_pattern:type==="assignment"?"{PREFIX}-{YEAR}-{NUMBER}":"{YEAR}-{NUMBER}"}
}
function preview(r:Row){
 const n=Math.max(Number(r.current_value||0)+1,Number(r.start_value||1));
 return (r.format_pattern||"{YEAR}-{NUMBER}")
  .replaceAll("{PREFIX}",r.prefix||"").replaceAll("{YEAR}",String(r.sequence_year))
  .replaceAll("{NUMBER}",String(n).padStart(Number(r.number_width||3),"0"))
  .replace(/^-+|-+$/g,"").replace(/--+/g,"-")
}

export default function NumberSequenceSettings({companyId}:{companyId:string}){
 const[rows,setRows]=useState<Row[]>([]),[year,setYear]=useState(new Date().getFullYear()+1),[msg,setMsg]=useState(""),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 async function load(){setErr("");const r=await fetch(`/api/companies/${companyId}/number-sequences`,{cache:"no-store"}),j=await r.json();if(!r.ok){setErr(j.error||"Fehler");return}setRows(j)}
 useEffect(()=>{load()},[companyId]);
 function addYear(){setRows(old=>{const next=[...old];for(const type of order)if(!next.some(x=>Number(x.sequence_year)===Number(year)&&x.sequence_type===type))next.push(defaults(Number(year),type));return next})}
 function patch(i:number,k:keyof Row,v:any){setRows(a=>a.map((x,n)=>n===i?{...x,[k]:["sequence_year","start_value","current_value","number_width"].includes(k as string)?Number(v):v}:x))}
 async function save(){setBusy(true);setErr("");setMsg("");try{const r=await fetch(`/api/companies/${companyId}/number-sequences`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sequences:rows})}),j=await r.json();if(!r.ok)throw new Error(j.error||"Speichern fehlgeschlagen.");setMsg("Nummernkreise gespeichert.");await load()}catch(e){setErr(e instanceof Error?e.message:"Fehler")}finally{setBusy(false)}}
 const sorted=useMemo(()=>[...rows].sort((a,b)=>b.sequence_year-a.sequence_year||order.indexOf(a.sequence_type)-order.indexOf(b.sequence_type)),[rows]);
 return <div className="card">
  <h2>Nummernkreise</h2>
  <p className="muted small">Getrennt je Firma und Jahr. Der Startwert gilt für den ersten neu vergebenen Wert des Jahres. Bereits verwendete Nummern werden nicht zurückgesetzt.</p>
  {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
  <div className="numberYearAdd"><div className="field"><label>Jahr vorbereiten</label><input type="number" min="2000" max="2100" value={year} onChange={e=>setYear(Number(e.target.value))}/></div><button type="button" className="button secondary" onClick={addYear}>Jahr hinzufügen</button></div>
  <div className="numberSeqList">{sorted.map((r)=>{
   const idx=rows.indexOf(r);
   return <div className="numberSeqRow" key={`${r.sequence_year}-${r.sequence_type}`}>
    <div className="numberSeqTitle"><strong>{r.sequence_year} · {labels[r.sequence_type]||r.sequence_type}</strong><span className="pill">Nächste: {preview(r)}</span></div>
    <div className="formGrid">
     <div className="field"><label>Startwert</label><input type="number" min="0" value={r.start_value} onChange={e=>patch(idx,"start_value",e.target.value)}/></div>
     <div className="field"><label>Aktueller Stand</label><input value={r.current_value||0} readOnly/></div>
     <div className="field"><label>Stellen</label><input type="number" min="1" max="12" value={r.number_width} onChange={e=>patch(idx,"number_width",e.target.value)}/></div>
     <div className="field"><label>Präfix</label><input value={r.prefix||""} onChange={e=>patch(idx,"prefix",e.target.value)} placeholder="z. B. AE"/></div>
     <div className="field full"><label>Format</label><input value={r.format_pattern} onChange={e=>patch(idx,"format_pattern",e.target.value)}/><small>Platzhalter: {"{YEAR}"} · {"{NUMBER}"} · {"{PREFIX}"}</small></div>
    </div>
   </div>
  })}</div>
  <button type="button" className="button success" disabled={busy} onClick={save}>{busy?"Speichere …":"Nummernkreise speichern"}</button>
 </div>
}
