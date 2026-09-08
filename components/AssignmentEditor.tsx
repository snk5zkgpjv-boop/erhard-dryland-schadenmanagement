"use client";
import {FormEvent,useEffect,useState} from "react";
import Link from "next/link";

export default function AssignmentEditor({caseId}:{caseId:string}){
 const[d,setD]=useState<any>(null),[c,setC]=useState<any>(null),[loaded,setLoaded]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
 useEffect(()=>{(async()=>{try{
   const [ra,rc]=await Promise.all([
     fetch(`/api/cases/${caseId}/assignment`,{cache:"no-store"}),
     fetch(`/api/cases/${caseId}`,{cache:"no-store"})
   ]);
   const a=await ra.json(),caseData=await rc.json();
   setD(a||{});setC(caseData||{});setLoaded(true)
 }catch{setErr("Auftragserteilung konnte nicht geladen werden.");setLoaded(true)}})()},[caseId]);

 async function save(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setErr("");setMsg("");
   const r=await fetch(`/api/cases/${caseId}/assignment`,{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries()))
   });
   const j=await r.json();if(!r.ok){setErr(j.error||"Fehler");return}
   setD((x:any)=>({...x,id:j.id}));setMsg("Auftragserteilung gespeichert.")
 }

 if(!loaded)return <div className="card empty">Lade Auftragserteilung …</div>;
 const defaultScope=d?.scope||c?.recommended_action||c?.damage_description||"Leckageortung & Trocknung";
 return <form className="card" onSubmit={save}>
  <div className="sectionHeader"><div><h2>Auftragserteilung</h2><p className="muted small">Auftraggeber-, Objekt- und Versicherungsdaten werden aus dem Schaden übernommen.</p></div>
   <Link className="button secondary" href={`/cases/${caseId}/forms`}>Formulare / Nachweise</Link>
  </div>
  {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
  <div className="formGrid" style={{marginTop:12}}>
   <div className="field"><label>Datum</label><input type="date" name="assignment_date" defaultValue={String(d?.assignment_date||new Date().toISOString()).slice(0,10)}/></div>
   <div className="field"><label>Versicherung</label><input name="insurer" defaultValue={d?.insurer||c?.insurer||""}/></div>
   <div className="field"><label>Schadennummer</label><input name="claim_number" defaultValue={d?.claim_number||c?.claim_number||""}/></div>
   <div className="field"><label>Versicherungsnummer</label><input name="insurance_number" defaultValue={d?.insurance_number||c?.insurance_number||""}/></div>
   <div className="field full"><label>Beauftragte Maßnahmen</label><textarea name="scope" defaultValue={defaultScope}/></div>
  </div>
  <div className="actions" style={{marginTop:12}}>
   <button className="button success">Auftragserteilung speichern / aktualisieren</button>
   {(d?.id||msg)&&<Link className="button secondary" href={`/cases/${caseId}/assignment/view`}>Auftragserteilung ansehen</Link>}
  </div>
 </form>
}
