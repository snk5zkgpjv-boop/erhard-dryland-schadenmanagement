"use client";
import {FormEvent,useEffect,useState} from "react";import {useRouter} from "next/navigation";
type Company={id:string;name:string};
export default function DirectOrderForm(){
 const router=useRouter(),[companies,setCompanies]=useState<Company[]>([]),[err,setErr]=useState("");
 useEffect(()=>{fetch("/api/companies").then(r=>r.json()).then(setCompanies)},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=e.currentTarget;const o:any=Object.fromEntries(new FormData(f).entries());o.damage_type="direktauftrag";o.title=o.title||`Direktauftrag ${o.customer_last_name||o.customer_company_name||""}`;const r=await fetch("/api/cases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});const j=await r.json();if(!r.ok){setErr(j.error||"Fehler");return}router.push(`/documents/new?case_id=${j.id}`)}
 return <form className="card" onSubmit={submit}>{err&&<div className="error">{err}</div>}<div className="formGrid">
 <div className="field"><label>Firma *</label><select name="company_id" required defaultValue=""><option value="" disabled>Firma wählen</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 <div className="field"><label>Bezeichnung</label><input name="title" placeholder="z. B. Renovierung Wohnung Müller"/></div>
 <div className="field full"><h3>Rechnungsempfänger / Kunde</h3></div>
 <div className="field"><label>Vorname</label><input name="customer_first_name"/></div><div className="field"><label>Nachname</label><input name="customer_last_name"/></div>
 <div className="field full"><label>Firma / Auftraggeber</label><input name="customer_company_name"/></div>
 <div className="field full"><label>Rechnungsanschrift – Straße / Hausnummer</label><input name="customer_street"/></div>
 <div className="field"><label>Rechnungsanschrift – PLZ</label><input name="customer_postal_code"/></div><div className="field"><label>Rechnungsanschrift – Ort</label><input name="customer_city"/></div>
 <div className="field"><label>E-Mail</label><input type="email" name="customer_email"/></div><div className="field"><label>Telefon</label><input name="customer_phone"/></div>
 <div className="field full"><h3>Leistungsort</h3></div>
 <div className="field full"><label>Leistungsort – Straße</label><input name="object_street"/></div><div className="field"><label>PLZ</label><input name="object_postal_code"/></div><div className="field"><label>Ort</label><input name="object_city"/></div>
 </div><button className="button success" style={{marginTop:14}}>Weiter zur Dokumenterstellung</button></form>
}
