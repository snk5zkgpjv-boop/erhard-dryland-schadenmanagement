"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

const labels=[
 ["Schaden","aufgenommen"],
 ["Angebot","erstellt"],
 ["Auftrag","erteilt"],
 ["Ausführung","Trocknung / Rapporte"],
 ["Abschluss","Trocknung beendet"],
 ["Rechnung","erstellt"]
];

export default function WorkflowPanel({caseId}:{caseId:string}){
 const[d,setD]=useState<any>(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch(`/api/cases/${caseId}/workflow`,{cache:"no-store"});const j=await r.json();if(r.ok)setD(j);else setErr(j.error||"Workflow konnte nicht geladen werden.")}
 useEffect(()=>{load()},[caseId]);
 async function createAssignment(){
  setBusy(true);setErr("");
  const r=await fetch(`/api/cases/${caseId}/workflow/assignment-from-offer`,{method:"POST"}),j=await r.json();
  if(!r.ok){setErr(j.error||"Auftragserteilung konnte nicht erstellt werden.");setBusy(false);return}
  location.href=`/cases/${caseId}/assignment/view`
 }
 if(!d)return err?<div className="error">{err}</div>:<div className="workflowCard">Lade Ablauf …</div>;
 const phase=Math.min(5,Number(d.phase)||0);
 return <section className="workflowCard">
  <div className="workflowHeader"><div><h2>Auftragsablauf</h2><div className="workflowHint">Schaden → Angebot → Auftragserteilung → Ausführung → Abschluss → Rechnung</div></div><Link className="button secondary smallButton" href={`/cases/${caseId}/forms`}>Formulare & Nachweise</Link></div>
  <div className="workflowSteps">{labels.map((x,i)=><div key={x[0]} className={`workflowStep ${i<phase?"done":""} ${i===phase?"active":""}`}><span className="stepNo">{i+1}</span><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div>
  <div className="workflowActions">
   {!d.offer&&<Link className="button" href={`/documents/new?case_id=${caseId}&type=angebot`}>Angebot erstellen</Link>}
   {d.offer&&<Link className="button secondary" href={`/documents/${d.offer.id}/view`}>Angebot {d.offer.document_number||""} öffnen</Link>}
   {d.offer&&!d.assignment&&<button className="button" disabled={busy} onClick={createAssignment}>{busy?"Erstelle …":"Auftragserteilung aus Angebot"}</button>}
   {d.assignment&&<Link className="button secondary" href={`/cases/${caseId}/assignment/view`}>Auftragserteilung öffnen</Link>}
   {d.assignment&&<Link className="button secondary" href={`/cases/${caseId}/drying-energy`}>Ausführung & Verbrauch</Link>}
   {d.assignment&&!d.invoice&&<Link className="button" href={`/documents/new?case_id=${caseId}&type=rechnung${d.offer?`&source_document_id=${d.offer.id}`:""}`}>Rechnung erstellen</Link>}
   {d.invoice&&<Link className="button secondary" href={`/documents/${d.invoice.id}/view`}>Rechnung {d.invoice.document_number||""} öffnen</Link>}
  </div>
  {err&&<div className="error" style={{marginTop:8}}>{err}</div>}
 </section>
}
