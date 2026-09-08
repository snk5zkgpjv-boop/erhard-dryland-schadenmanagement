"use client";
import {FormEvent,useEffect,useState} from "react";
export default function DamageReportEditor({caseId}:{caseId:string}){
 const[data,setData]=useState<any>(null),[msg,setMsg]=useState(""),[err,setErr]=useState("");
 useEffect(()=>{fetch(`/api/cases/${caseId}/damage-report`,{cache:"no-store"}).then(r=>r.json()).then(setData).catch(()=>setErr("Berichtsdaten konnten nicht geladen werden."))},[caseId]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setMsg("");setErr("");const b=Object.fromEntries(new FormData(e.currentTarget).entries());const r=await fetch(`/api/cases/${caseId}/damage-report`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});const j=await r.json();if(!r.ok){setErr(j.error||"Speichern fehlgeschlagen.");return}setMsg("Berichtsdaten gespeichert.")}
 if(!data)return <div className="card empty">Lade Berichtsdaten …</div>;
 return <form className="card" onSubmit={save}>
  <h2>Berichtsdaten</h2>
  <p className="muted small">Diese Angaben steuern den vierseitigen Schadensbericht nach deinem Dryland-Muster.</p>
  {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
  <div className="formGrid" style={{marginTop:12}}>
   <div className="field"><label>Berichtsdatum</label><input type="date" name="report_date" defaultValue={String(data.report_date||"").slice(0,10)}/></div>
   <div className="field"><label>Berichtsnummer</label><input name="report_number" defaultValue={data.report_number||""}/></div>
   <div className="field"><label>Ausführender Techniker</label><input name="technician" defaultValue={data.technician||""}/></div>
   <div className="field"><label>Objektbaujahr</label><input name="building_year" defaultValue={data.building_year||"unbekannt"} placeholder="unbekannt oder z. B. 1984"/></div>
   <div className="field"><label>Objekttyp</label><select name="building_type" defaultValue={data.building_type||"Mehrfamilienhaus"}><option>Einfamilienhaus</option><option>Mehrfamilienhaus</option><option>Gewerbe</option><option>Sonstiges</option></select></div>
   <div className="field full"><label>Anwesende Personen / Anmerkungen</label><textarea name="investigation_description" defaultValue={data.investigation_description||""} placeholder={"z. B. Geisser, Joachim – Techniker – Dryland Trocknungstechnik\nLink, Axel – Techniker – Dryland Trocknungstechnik"}/></div>
   <div className="field full"><label>Angaben zu Bauteilöffnungen</label><textarea name="openings_description" defaultValue={data.openings_description||""} placeholder="z. B. Innenbereich: DG-Badezimmer: gemauerte rechte Seite des Duschtassensockels"/></div>
   <div className="field full"><label>Weitere Vorgehensweise</label><textarea style={{minHeight:260}} name="further_action" defaultValue={data.further_action||""}/></div>
   <div className="field full"><label>Wichtiger Hinweis / Haftungsausschluss</label><textarea style={{minHeight:220}} name="disclaimer_text" defaultValue={data.disclaimer_text||""}/></div>
  </div>
  <button className="button success" style={{marginTop:14}}>Berichtsdaten speichern</button>
 </form>
}
