"use client";
import {useEffect,useState} from "react";import Link from "next/link";import QRCode from "qrcode";
export default function EquipmentUnits({equipmentId}:{equipmentId:string}){
 const[data,setData]=useState<any>(null),[qr,setQr]=useState<Record<string,string>>({}),[err,setErr]=useState("");
 async function load(){const r=await fetch(`/api/equipment/${equipmentId}/units`,{cache:"no-store"});const j=await r.json();if(!r.ok){setErr(j.error||"Fehler");return}setData(j);const q:any={};for(const u of j.units){const url=`${window.location.origin}/equipment/unit/${u.qr_token}`;q[u.id]=await QRCode.toDataURL(url,{width:220,margin:1})}setQr(q)}
 useEffect(()=>{load()},[equipmentId]);
 if(err)return <div className="error">{err}</div>;if(!data)return <div className="card">Lade Einzelgeräte …</div>;
 return <div className="card"><h2>{data.equipment.equipment_code} · {data.equipment.name}</h2><p className="muted">Bestand: {data.equipment.stock_quantity} Stück. Jedes physische Gerät besitzt einen eigenen QR-Code.</p>
  <div className="unitGrid">{data.units.map((u:any)=><div className="unitCard" key={u.id}><strong>{u.unit_code}</strong>{qr[u.id]&&<img src={qr[u.id]} alt={`QR ${u.unit_code}`}/>}<div className="caseMeta">Seriennr.: {u.serial_number||"noch nicht eingetragen"}<br/>Letzte Wartung: {u.last_maintenance?new Date(u.last_maintenance).toLocaleDateString("de-DE"):"–"}<br/>Nächste Wartung: {u.next_due_date?new Date(u.next_due_date).toLocaleDateString("de-DE"):"–"}</div><Link className="button secondary" href={`/equipment/unit/${u.qr_token}`}>Gerät / Wartung öffnen</Link></div>)}</div>
 </div>
}
