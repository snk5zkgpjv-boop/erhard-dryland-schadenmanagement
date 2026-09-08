"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";import LogoutButton from "@/components/LogoutButton";
type Company={id:string;code:string;name:string};
type CaseRow={id:string;title:string;case_number:string|null;status:string;damage_type?:string;object_street:string|null;object_postal_code:string|null;object_city:string|null;company_code:string;company_name:string;created_at:string};
export default function Dashboard(){
 const[companies,setCompanies]=useState<Company[]>([]),[cases,setCases]=useState<CaseRow[]>([]),[selectedCompany,setSelectedCompany]=useState("ALL"),[loading,setLoading]=useState(true),[error,setError]=useState(""),[auth,setAuth]=useState<any>(null);
 async function load(){try{setLoading(true);const[a,b]=await Promise.all([fetch("/api/companies",{cache:"no-store"}),fetch("/api/cases",{cache:"no-store"})]);if(!a.ok||!b.ok)throw new Error("Daten konnten nicht geladen werden.");setCompanies(await a.json());setCases(await b.json())}catch(e){setError(e instanceof Error?e.message:"Fehler")}finally{setLoading(false)}}
 useEffect(()=>{load();fetch("/api/auth/status",{cache:"no-store"}).then(r=>r.json()).then(setAuth).catch(()=>{})},[]);
 const damageCases=cases.filter(c=>!c.damage_type||c.damage_type==="wasserschaden"),filtered=useMemo(()=>selectedCompany==="ALL"?damageCases:damageCases.filter(c=>c.company_code===selectedCompany),[cases,selectedCompany]);
 return <>
  <section className="hero"><span className="pill">Version 0.9.6</span><h1>Schadenmanagement</h1><p className="muted">Gemeinsame digitale Schadenakte für Erhard Dienstleistungen und Dryland Trocknungstechnik.</p>{auth?.user&&<p className="small muted">Angemeldet als <strong>{auth.user.display_name}</strong> · {auth.user.role==="admin"?"Admin":auth.user.role==="buero"?"Büro":"Techniker"}</p>}
   <div className="actions" style={{marginTop:12}}><Link className="button" href="/cases/new">+ Neuer Schaden</Link>{(auth?.user?.role==="admin"||auth?.user?.role==="buero")&&<><Link className="button secondary" href="/direct/new">Angebot/Rechnung direkt</Link><Link className="button secondary" href="/documents">Dokumente</Link><Link className="button secondary" href="/articles">Artikelliste</Link></>}{auth?.user?.role==="admin"&&<><Link className="button secondary" href="/equipment">Geräte</Link><Link className="button secondary" href="/settings/companies">Firmendaten</Link><Link className="button secondary" href="/users">Benutzer</Link></>}<button className="button secondary" onClick={load}>Aktualisieren</button><LogoutButton/></div>
  </section>
  {error&&<div className="error">{error}</div>}
  <section className="grid cols2">{companies.map(c=><div key={c.id} className="card companyCard" onClick={()=>setSelectedCompany(c.code)}><span className="pill">{c.code}</span><div className="companyName">{c.name}</div></div>)}</section>
  <section className="section"><div className="topbar"><div><h2>Schadensfälle</h2><div className="muted small">{selectedCompany==="ALL"?"Alle Firmen":selectedCompany}</div></div>{selectedCompany!=="ALL"&&<button className="button secondary" onClick={()=>setSelectedCompany("ALL")}>Alle anzeigen</button>}</div>
   {loading?<div className="card empty">Lade Schadensfälle …</div>:filtered.length===0?<div className="card empty">Noch keine Schadensfälle vorhanden.</div>:<div className="grid">{filtered.map(c=><Link className="card" href={"/cases/"+c.id} key={c.id}><div className="caseRow"><div><div className="caseTitle">{c.title}</div><div className="caseMeta">{c.company_name}{c.case_number?" · "+c.case_number:""}<br/>{[c.object_street,[c.object_postal_code,c.object_city].filter(Boolean).join(" ")].filter(Boolean).join(", ")||"Objektadresse noch offen"}</div></div><span className="status">{c.status}</span></div></Link>)}</div>}
  </section>
 </>
}
