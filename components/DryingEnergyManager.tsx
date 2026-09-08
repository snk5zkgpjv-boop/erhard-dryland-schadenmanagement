"use client";
import {FormEvent,useEffect,useState} from "react";
import Link from "next/link";

export default function DryingEnergyManager({caseId}:{caseId:string}){
 const[d,setD]=useState<any>({items:[],total_kwh:0}),[err,setErr]=useState(""),[msg,setMsg]=useState("");
 async function load(){const r=await fetch(`/api/cases/${caseId}/drying-energy`,{cache:"no-store"}),j=await r.json();if(r.ok)setD(j);else setErr(j.error||"Fehler")}
 useEffect(()=>{load()},[caseId]);
 async function save(e:FormEvent<HTMLFormElement>,id:string){
  e.preventDefault();setErr("");setMsg("");
  const body:any=Object.fromEntries(new FormData(e.currentTarget).entries());body.installation_id=id;
  const r=await fetch(`/api/cases/${caseId}/drying`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),j=await r.json();
  if(!r.ok){setErr(j.error||"Speichern fehlgeschlagen.");return}setMsg("Laufzeit / Verbrauch gespeichert.");await load()
 }
 return <div>
  <div className="summaryBar"><div><strong>{Number(d.total_kwh||0).toLocaleString("de-DE",{maximumFractionDigits:1})} kWh</strong><div className="muted small">aktuell berechneter Gesamtverbrauch aller Trocknungsgeräte</div></div><Link className="button secondary" href={`/cases/${caseId}/forms`}>Energienachweise</Link></div>
  {msg&&<div className="notice">{msg}</div>}{err&&<div className="error">{err}</div>}
  <div className="runtimeGrid">{d.items.map((x:any)=><form className="runtimeCard" key={x.id} onSubmit={e=>save(e,x.id)}>
   <h3>{x.equipment_code?`${x.equipment_code} · `:""}{x.equipment_name||x.drying_method||"Trocknungsgerät"}</h3>
   <div className="caseMeta">{x.room||"ohne Raum"} · {new Date(x.installed_at).toLocaleDateString("de-DE")} bis {x.removed_at?new Date(x.removed_at).toLocaleDateString("de-DE"):"aktuell"}</div>
   <div className="runtimeMetrics">
    <div className="runtimeMetric"><strong>{Number(x.runtime_days||0).toLocaleString("de-DE",{maximumFractionDigits:1})}</strong><span>Tage</span></div>
    <div className="runtimeMetric"><strong>{x.power_kw==null?"–":Number(x.power_kw).toLocaleString("de-DE",{maximumFractionDigits:3})}</strong><span>kW</span></div>
    <div className="runtimeMetric"><strong>{x.calculated_kwh==null?"–":Number(x.calculated_kwh).toLocaleString("de-DE",{maximumFractionDigits:1})}</strong><span>kWh</span></div>
   </div>
   <div className="calcFormula">Automatisch: Leistung (kW) × Laufzeit (Tage) × 24 h. Tatsächliche Werte kannst du überschreiben.</div>
   <div className="formGrid">
    <div className="field"><label>Tatsächliche Laufzeit Tage</label><input name="runtime_days_override" type="number" step="0.1" min="0" defaultValue={x.runtime_days_override??Number(x.runtime_days||0).toFixed(1)}/></div>
    <div className="field"><label>Leistung kW</label><input name="power_kw_override" type="number" step="0.001" min="0" defaultValue={x.power_kw_override??x.power_kw??""}/></div>
    <div className="field full"><label>Verbrauch kWh überschreiben (optional)</label><input name="consumption_kwh_override" type="number" step="0.1" min="0" defaultValue={x.consumption_kwh_override??""} placeholder="leer = automatisch berechnen"/></div>
   </div>
   <button className="button success">Werte speichern</button>
  </form>)}</div>
  {!d.items.length&&<div className="card empty">Noch keine Trocknungsgeräte im Schaden erfasst.</div>}
 </div>
}
