"use client";
import {FormEvent,useState} from "react";
import {SelectOrCustom,STANDARD_FLOORS} from "@/components/RoomFields";

export default function CaseMasterEditor({data,onSaved}:{data:any;onSaved?:()=>Promise<void>|void}){
 const[saving,setSaving]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setMsg("");setErr("");
  try{
   const body=Object.fromEntries(new FormData(e.currentTarget).entries());
   const r=await fetch(`/api/cases/${data.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const j=await r.json();if(!r.ok)throw new Error(j.error||"Speichern fehlgeschlagen.");
   setMsg("Schadens- und Auftraggeberdaten gespeichert.");
   if(onSaved) await onSaved();
  }catch(e){setErr(e instanceof Error?e.message:"Speichern fehlgeschlagen.")}finally{setSaving(false)}
 }
 return <form className="card" onSubmit={save}>
  <h2>Schadens- und Auftraggeberdaten bearbeiten</h2>
  <p className="muted small">Hier kannst du auch nach der Schadenaufnahme Auftraggeberanschrift, Schadensort und Versicherungsdaten ändern. Der Schadensbericht übernimmt diese Werte automatisch.</p>
  {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
  <div className="formGrid" style={{marginTop:12}}>
   <div className="field"><label>Vorgangs-/Projektnummer</label><input name="case_number" defaultValue={data.case_number||""}/></div>
   <div className="field"><label>Bezeichnung des Schadens</label><input name="title" defaultValue={data.title||""} required/></div>

   <div className="field full"><h3 style={{margin:"8px 0 0"}}>Auftraggeber / Kunde</h3></div>
   <div className="field"><label>Vorname</label><input name="customer_first_name" defaultValue={data.customer_first_name||""}/></div>
   <div className="field"><label>Nachname</label><input name="customer_last_name" defaultValue={data.customer_last_name||""}/></div>
   <div className="field full"><label>Firma / Hausverwaltung</label><input name="customer_company_name" defaultValue={data.customer_company_name||""}/></div>
   <div className="field full"><label>Auftraggeber – Straße / Hausnummer</label><input name="customer_street" defaultValue={data.customer_street||""}/></div>
   <div className="field"><label>Auftraggeber – PLZ</label><input name="customer_postal_code" defaultValue={data.customer_postal_code||""}/></div>
   <div className="field"><label>Auftraggeber – Ort</label><input name="customer_city" defaultValue={data.customer_city||""}/></div>
   <div className="field"><label>E-Mail</label><input type="email" name="customer_email" defaultValue={data.customer_email||""}/></div>
   <div className="field"><label>Telefon</label><input name="customer_phone" defaultValue={data.customer_phone||""}/></div>

   <div className="field full"><h3 style={{margin:"12px 0 0"}}>Schadensort / Messort</h3></div>
   <div className="field full"><label>Schadensort – Straße / Hausnummer</label><input name="object_street" defaultValue={data.object_street||""}/></div>
   <div className="field"><label>Schadensort – PLZ</label><input name="object_postal_code" defaultValue={data.object_postal_code||""}/></div>
   <div className="field"><label>Schadensort – Ort</label><input name="object_city" defaultValue={data.object_city||""}/></div>
   <SelectOrCustom name="floor" items={STANDARD_FLOORS} label="Etage / Geschoss" value={data.floor||""} placeholder="z. B. 7. OG"/>
   <div className="field"><label>Wohnung / Einheit</label><input name="unit" defaultValue={data.unit||""}/></div>

   <div className="field"><label>Versicherung</label><input name="insurer" defaultValue={data.insurer||""}/></div>
   <div className="field"><label>Schadennummer</label><input name="claim_number" defaultValue={data.claim_number||""}/></div>
   <div className="field"><label>Versicherungsnummer</label><input name="insurance_number" defaultValue={data.insurance_number||""}/></div>
   <div className="field"><label>Referenznummer</label><input name="reference_number" defaultValue={data.reference_number||""}/></div>
   <div className="field full"><label>Schadensursache</label><textarea name="damage_cause" defaultValue={data.damage_cause||""}/></div>
   <div className="field full"><label>Schadensbeschreibung</label><textarea name="damage_description" defaultValue={data.damage_description||""}/></div>
   <div className="field full"><label>Handlungsempfehlung</label><textarea name="recommended_action" defaultValue={data.recommended_action||""}/></div>
  </div>
  <button className="button success" style={{marginTop:14}} disabled={saving}>{saving?"Speichere …":"Änderungen speichern"}</button>
 </form>
}
