"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
type Company={id:string;code:string;name:string};
type CaseRow={id:string;title:string;case_number:string|null;status:string;object_street:string|null;object_postal_code:string|null;object_city:string|null;company_code:string;company_name:string;created_at:string};
export default function Dashboard(){
  const[companies,setCompanies]=useState<Company[]>([]);const[cases,setCases]=useState<CaseRow[]>([]);const[selectedCompany,setSelectedCompany]=useState("ALL");const[loading,setLoading]=useState(true);const[error,setError]=useState("");
  async function load(){try{setLoading(true);const[a,b]=await Promise.all([fetch("/api/companies",{cache:"no-store"}),fetch("/api/cases",{cache:"no-store"})]);if(!a.ok||!b.ok)throw new Error("Daten konnten nicht geladen werden.");setCompanies(await a.json());setCases(await b.json())}catch(e){setError(e instanceof Error?e.message:"Fehler")}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>selectedCompany==="ALL"?cases:cases.filter(c=>c.company_code===selectedCompany),[cases,selectedCompany]);
  return <>
    <section className="hero"><span className="pill">Version 0.2</span><h1>Schadenmanagement</h1><p className="muted">Gemeinsame digitale Schadenakte für Erhard Dienstleistungen und Dryland Trocknungstechnik.</p><div className="actions" style={{marginTop:14}}><Link className="button" href="/cases/new">+ Neuer Schaden</Link><Link className="button secondary" href="/equipment">Geräteverwaltung</Link><button className="button secondary" onClick={load}>Aktualisieren</button></div></section>
    {error&&<div className="error">{error}</div>}
    <section className="grid cols2">
      <div className="card companyCard" onClick={()=>setSelectedCompany("ERHARD")}><span className="pill">ERHARD</span><div className="companyName">Erhard Dienstleistungen</div><p className="muted small">Sanierung, Wiederherstellung, Angebote und Rechnungen.</p></div>
      <div className="card companyCard" onClick={()=>setSelectedCompany("DRYLAND")}><span className="pill">DRYLAND</span><div className="companyName">Dryland Trocknungstechnik</div><p className="muted small">Leckageortung, Trocknung, Rapporte und Energieverbrauch.</p></div>
    </section>
    <section className="section"><div className="topbar"><div><h2>Schadensfälle</h2><div className="muted small">{selectedCompany==="ALL"?"Alle Firmen":selectedCompany}</div></div>{selectedCompany!=="ALL"&&<button className="button secondary" onClick={()=>setSelectedCompany("ALL")}>Alle anzeigen</button>}</div>
      {loading?<div className="card empty">Lade Schadensfälle …</div>:filtered.length===0?<div className="card empty">Noch keine Schadensfälle vorhanden.</div>:<div className="grid">{filtered.map(c=><Link className="card" href={"/cases/"+c.id} key={c.id}><div className="caseRow"><div><div className="caseTitle">{c.title}</div><div className="caseMeta">{c.company_name}{c.case_number?" · "+c.case_number:""}<br/>{[c.object_street,[c.object_postal_code,c.object_city].filter(Boolean).join(" ")].filter(Boolean).join(", ")||"Objektadresse noch offen"}</div></div><span className="status">{c.status}</span></div></Link>)}</div>}
    </section>
  </>
}
