"use client";import {FormEvent,useEffect,useState} from "react";
type C={id:string;code:string;name:string};
type U={id:string;username:string;display_name:string;email:string|null;role:"admin"|"techniker"|"buero";active:boolean;companies:C[]};
const labels={admin:"Admin",techniker:"Techniker",buero:"Büro"};

export default function UserManager(){
 const[users,setUsers]=useState<U[]>([]),[companies,setCompanies]=useState<C[]>([]),[err,setErr]=useState(""),[msg,setMsg]=useState("");
 const[displayName,setDisplayName]=useState(""),[username,setUsername]=useState(""),[email,setEmail]=useState("");
 async function load(){
  const [ru,rc]=await Promise.all([fetch("/api/users",{cache:"no-store"}),fetch("/api/companies",{cache:"no-store"})]);
  const ju=await ru.json(),jc=await rc.json();
  if(ru.ok)setUsers(ju);else setErr(ju.error||"Fehler");
  if(rc.ok)setCompanies(jc);
 }
 useEffect(()=>{load()},[]);
 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setErr("");setMsg("");const f=e.currentTarget,fd=new FormData(f);
  const body:any=Object.fromEntries(fd.entries());body.company_ids=fd.getAll("company_ids");
  const r=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),j=await r.json();
  if(!r.ok){setErr(j.error||"Fehler");return}
  f.reset();setDisplayName("");setUsername("");setEmail("");setMsg("Benutzer angelegt.");load()
 }
 async function patch(id:string,b:any){const r=await fetch(`/api/users/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});if(!r.ok){const j=await r.json();setErr(j.error||"Änderung fehlgeschlagen.");return}load()}
 function toggleCompany(u:U,companyId:string,checked:boolean){
   const ids=u.companies.map(c=>c.id);
   const next=checked?Array.from(new Set([...ids,companyId])):ids.filter(id=>id!==companyId);
   patch(u.id,{company_ids:next});
 }
 return <section className="grid cols2">
  <form className="card" onSubmit={create} autoComplete="off"><h2>Benutzer anlegen</h2>{err&&<div className="error">{err}</div>}{msg&&<div className="notice">{msg}</div>}
   <div className="formGrid">
    <div className="field"><label>Anzeigename *</label><input name="display_name" value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="off" required/></div>
    <div className="field"><label>Benutzername *</label><input name="username" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="new-password" spellCheck={false} required/></div>
    <div className="field"><label>E-Mail</label><input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off"/></div>
    <div className="field"><label>Rolle *</label><select name="role" defaultValue="techniker"><option value="techniker">Techniker</option><option value="buero">Büro</option><option value="admin">Admin</option></select></div>
    <div className="field full"><label>Firma / Firmen *</label><div className="companyChecks">{companies.map(c=><label className="checkRow" key={c.id}><input type="checkbox" name="company_ids" value={c.id}/><span>{c.name}</span></label>)}</div></div>
    <div className="field full"><label>Startpasswort *</label><input type="password" name="password" minLength={8} autoComplete="new-password" required/></div>
   </div><button className="button success">Benutzer speichern</button>
  </form>
  <div className="card"><h2>Benutzerrollen & Firmenzugriff</h2><p className="muted small">Benutzer sehen ausschließlich Schäden der Firmen, denen sie hier zugeordnet sind. Ein Benutzer kann Erhard, Dryland oder beide Firmen erhalten.</p>
   {users.map(u=><div key={u.id} className="userAccessRow">
    <div><strong>{u.display_name}</strong><div className="caseMeta">@{u.username}{u.email?` · ${u.email}`:""}</div></div>
    <select value={u.role} onChange={e=>patch(u.id,{role:e.target.value})}>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
    <div className="companyChecks">{companies.map(c=><label className="toggleLabel" key={c.id}><input type="checkbox" checked={u.companies.some(x=>x.id===c.id)} onChange={e=>toggleCompany(u,c.id,e.target.checked)}/>{c.code}</label>)}</div>
    <label className="toggleLabel"><input type="checkbox" checked={u.active} onChange={e=>patch(u.id,{active:e.target.checked})}/> aktiv</label>
   </div>)}
  </div>
 </section>
}
