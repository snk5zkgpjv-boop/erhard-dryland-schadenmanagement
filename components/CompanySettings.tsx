"use client";
import {FormEvent,useEffect,useState} from "react";
import Link from "next/link";
import NumberSequenceSettings from "@/components/NumberSequenceSettings";
export default function CompanySettings(){
 const[companies,setCompanies]=useState<any[]>([]),[selected,setSelected]=useState(""),[data,setData]=useState<any>(null),[msg,setMsg]=useState(""),[err,setErr]=useState("");
 useEffect(()=>{fetch("/api/companies",{cache:"no-store"}).then(r=>r.json()).then(j=>{if(Array.isArray(j)){setCompanies(j);if(j[0])setSelected(j[0].id)}}).catch(()=>setErr("Firmen konnten nicht geladen werden."))},[]);
 useEffect(()=>{if(!selected)return;setMsg("");setErr("");fetch(`/api/companies/${selected}`,{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);setData(j)}).catch(e=>setErr(e.message))},[selected]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setErr("");setMsg("");const r=await fetch(`/api/companies/${selected}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries()))});const j=await r.json();if(!r.ok){setErr(j.error||"Speichern fehlgeschlagen.");return}setMsg("Firmendaten gespeichert. Neue Angebote und Rechnungen verwenden diese Angaben automatisch.")}
 if(!data)return <div className="card">{err||"Lade Firmendaten …"}</div>;
 const f=data.footer_json||{};
 return <div className="grid cols2">
  <form className="card" onSubmit={save}>
   <div className="sectionHeader"><div><h2>{data.name}</h2><div className="muted small">{data.code} · Kopf-/Fußzeile und Kontaktdaten</div></div><Link className="button secondary" href="/">Zur Übersicht</Link></div>
   {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
   <div className="field"><label>Firma auswählen</label><select value={selected} onChange={e=>setSelected(e.target.value)}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
   <div className="divider"/><h3>Firma & Anschrift</h3>
   <div className="formGrid">
    <div className="field full"><label>Firmenname</label><input name="name" defaultValue={data.name||""}/></div>
    <div className="field full"><label>Rechtlicher Firmenname / Zusatz</label><input name="legal_name" defaultValue={data.legal_name||""}/></div>
    <div className="field full"><label>Straße / Hausnummer</label><input name="street" defaultValue={data.street||""}/></div>
    <div className="field"><label>PLZ</label><input name="postal_code" defaultValue={data.postal_code||""}/></div>
    <div className="field"><label>Ort</label><input name="city" defaultValue={data.city||""}/></div>
   </div>
   <div className="divider"/><h3>Kontakt</h3>
   <div className="formGrid">
    <div className="field"><label>Telefon</label><input name="phone" defaultValue={data.phone||""}/></div>
    <div className="field"><label>Mobil</label><input name="mobile" defaultValue={data.mobile||""}/></div>
    <div className="field full"><label>E-Mail</label><input name="email" defaultValue={data.email||""}/></div>
    <div className="field full"><label>Webseite (optional)</label><input name="website" defaultValue={f.website||""}/></div>
    <div className="field full"><label>Standard-Bearbeiter</label><input name="default_editor" defaultValue={f.default_editor||""} placeholder="z. B. Robert Erhard"/></div>
   </div>
   <div className="divider"/><h3>Bank & Steuer</h3>
   <div className="formGrid">
    <div className="field full"><label>Kontoinhaber</label><input name="account_holder" defaultValue={f.account_holder||data.name||""}/></div>
    <div className="field full"><label>Bank</label><input name="bank_name" defaultValue={data.bank_name||""}/></div>
    <div className="field full"><label>IBAN</label><input name="iban" defaultValue={data.iban||""}/></div>
    <div className="field full"><label>BIC</label><input name="bic" defaultValue={data.bic||""}/></div>
    <div className="field"><label>Steuernummer</label><input name="tax_number" defaultValue={data.tax_number||""}/></div>
    <div className="field"><label>USt-IdNr.</label><input name="vat_id" defaultValue={data.vat_id||""}/></div>
   </div>
   <div className="divider"/><h3>Logo</h3>
   <div className="field"><label>Logo-Pfad / URL</label><input name="logo_url" defaultValue={data.logo_url||""} placeholder={data.code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"}/></div>
   <button className="button success" style={{marginTop:12}}>Firmendaten speichern</button>
  </form>
  <div><div className="card"><h2>Vorschau der Fußzeile</h2><div className="companyPreview"><div><strong>Kontoinhaber:</strong> {f.account_holder||data.name}<br/><strong>IBAN:</strong> {data.iban||"–"}<br/><strong>BIC:</strong> {data.bic||"–"}<br/><strong>Steuernummer:</strong> {data.tax_number||"–"}</div><div><strong>{data.name}</strong><br/>{data.street||""}<br/>{[data.postal_code,data.city].filter(Boolean).join(" ")}<br/>Tel.: {data.phone||"–"}<br/>Mobil: {data.mobile||"–"}</div></div><p className="muted small" style={{marginTop:12}}>Diese Werte werden direkt in Kopf- und Fußzeile der Dokumente übernommen.</p></div><div style={{marginTop:12}}><NumberSequenceSettings key={selected} companyId={selected}/></div></div>
 </div>
}
