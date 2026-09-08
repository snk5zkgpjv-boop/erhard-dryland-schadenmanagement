"use client";
import {FormEvent,useEffect,useState} from "react";import {useRouter} from "next/navigation";
type Company={id:string;code:string;name:string};
export default function NewCaseForm(){
 const router=useRouter();const[companies,setCompanies]=useState<Company[]>([]);const[saving,setSaving]=useState(false);const[error,setError]=useState("");
 useEffect(()=>{fetch("/api/companies",{cache:"no-store"}).then(r=>r.json()).then(setCompanies).catch(()=>setError("Firmen konnten nicht geladen werden."))},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError("");const body=Object.fromEntries(new FormData(e.currentTarget).entries());try{const res=await fetch("/api/cases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error||"Speichern fehlgeschlagen.");router.push("/cases/"+data.id);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Speichern fehlgeschlagen.")}finally{setSaving(false)}}
 return <form onSubmit={submit} className="card">{error&&<div className="error" style={{marginBottom:12}}>{error}</div>}<div className="formGrid">
  <div className="field"><label>Ausführende Firma *</label><select name="company_id" required defaultValue=""><option value="" disabled>Firma auswählen</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
  <div className="field"><label>Vorgangs-/Projektnummer</label><input name="case_number" placeholder="z. B. 2026-0041"/></div>
  <div className="field full"><label>Bezeichnung des Schadens *</label><input name="title" required placeholder="z. B. Wasserschaden Badezimmer – Müller"/></div>
  <div className="field"><label>Kunde / Vorname</label><input name="customer_first_name"/></div><div className="field"><label>Kunde / Nachname</label><input name="customer_last_name"/></div>
  <div className="field full"><label>Firma / Hausverwaltung als Auftraggeber</label><input name="customer_company_name"/></div>
  <div className="field full"><label>Schadenort – Straße</label><input name="object_street"/></div><div className="field"><label>PLZ</label><input name="object_postal_code"/></div><div className="field"><label>Ort</label><input name="object_city"/></div>
  <div className="field"><label>Etage</label><input name="floor" placeholder="z. B. 2. OG"/></div><div className="field"><label>Wohnung / Einheit</label><input name="unit"/></div>
  <div className="field"><label>Versicherung</label><input name="insurer"/></div><div className="field"><label>Schadennummer</label><input name="claim_number"/></div>
  <div className="field"><label>Versicherungsnummer</label><input name="insurance_number"/></div><div className="field"><label>Referenznummer</label><input name="reference_number"/></div>
  <div className="field full"><label>Schadensursache</label><textarea name="damage_cause"/></div><div className="field full"><label>Erste Schadensbeschreibung</label><textarea name="damage_description"/></div>
  <div className="field full"><label>Handlungsempfehlung</label><textarea name="recommended_action" placeholder="z. B. 2 Kondenstrockner und 2 Turboventilatoren"/></div>
 </div><div className="actions" style={{marginTop:16}}><button className="button success" disabled={saving}>{saving?"Speichere …":"Schaden anlegen"}</button></div></form>
}
