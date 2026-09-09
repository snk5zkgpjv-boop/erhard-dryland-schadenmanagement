"use client";
import {FormEvent,useEffect,useState} from "react";import {useRouter} from "next/navigation";import {SelectOrCustom,STANDARD_FLOORS} from "@/components/RoomFields";
type Company={id:string;code:string;name:string};
export default function NewCaseForm(){
 const router=useRouter();const[companies,setCompanies]=useState<Company[]>([]);const[saving,setSaving]=useState(false);const[error,setError]=useState("");
 useEffect(()=>{fetch("/api/companies",{cache:"no-store"}).then(r=>r.json()).then(setCompanies).catch(()=>setError("Firmen konnten nicht geladen werden."))},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError("");const body=Object.fromEntries(new FormData(e.currentTarget).entries());try{const res=await fetch("/api/cases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error||"Speichern fehlgeschlagen.");router.push("/cases/"+data.id);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Speichern fehlgeschlagen.")}finally{setSaving(false)}}
 return <form onSubmit={submit} className="card">{error&&<div className="error" style={{marginBottom:12}}>{error}</div>}<div className="formGrid">
  <div className="field"><label>Ausführende Firma *</label><select name="company_id" required defaultValue=""><option value="" disabled>Firma auswählen</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
  <div className="field"><label>Vorgangs-/Projektnummer</label><input name="case_number" placeholder="leer lassen = automatische Projektnummer"/><small>Die Nummer wird getrennt je Firma und Jahr fortlaufend vergeben.</small></div>
  <div className="field full"><label>Bezeichnung des Schadens *</label><input name="title" required placeholder="z. B. Wasserschaden Badezimmer – Müller"/></div>

  <div className="field full"><h3 style={{margin:"8px 0 0"}}>Auftraggeber / Kunde</h3><p className="muted small" style={{margin:"4px 0 0"}}>Diese Anschrift kann vom Schadensort abweichen und wird im Schadensbericht als Auftraggeber ausgegeben.</p></div>
  <div className="field"><label>Vorname</label><input name="customer_first_name"/></div><div className="field"><label>Nachname</label><input name="customer_last_name"/></div>
  <div className="field full"><label>Firma / Hausverwaltung</label><input name="customer_company_name"/></div>
  <div className="field full"><label>Auftraggeber – Straße / Hausnummer</label><input name="customer_street"/></div>
  <div className="field"><label>Auftraggeber – PLZ</label><input name="customer_postal_code"/></div><div className="field"><label>Auftraggeber – Ort</label><input name="customer_city"/></div>
  <div className="field"><label>E-Mail</label><input type="email" name="customer_email"/></div><div className="field"><label>Telefon</label><input name="customer_phone"/></div>

  <div className="field full"><h3 style={{margin:"12px 0 0"}}>Schadensort / Messort</h3></div>
  <div className="field full"><label>Schadensort – Straße / Hausnummer</label><input name="object_street"/></div><div className="field"><label>Schadensort – PLZ</label><input name="object_postal_code"/></div><div className="field"><label>Schadensort – Ort</label><input name="object_city"/></div>
  <SelectOrCustom name="floor" items={STANDARD_FLOORS} label="Etage / Geschoss" placeholder="z. B. 7. OG"/><div className="field"><label>Wohnung / Einheit</label><input name="unit"/></div>
  <div className="field"><label>Versicherung</label><input name="insurer"/></div><div className="field"><label>Schadennummer</label><input name="claim_number"/></div>
  <div className="field"><label>Versicherungsnummer</label><input name="insurance_number"/></div><div className="field"><label>Referenznummer</label><input name="reference_number"/></div>
  <div className="field full"><label>Schadensursache</label><textarea name="damage_cause"/></div><div className="field full"><label>Erste Schadensbeschreibung</label><textarea name="damage_description"/></div>
  <div className="field full"><label>Handlungsempfehlung</label><textarea name="recommended_action" placeholder="z. B. 2 Kondenstrockner und 2 Turboventilatoren"/></div>
 </div><div className="actions" style={{marginTop:16}}><button className="button success" disabled={saving}>{saving?"Speichere …":"Schaden anlegen"}</button></div></form>
}
