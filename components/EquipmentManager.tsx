"use client";
import {FormEvent,useEffect,useState} from "react";
type Eq={id:string;equipment_code:string;name:string;equipment_type:string|null;serial_number:string|null;power_watts:number|null;stock_quantity:number};
async function imageToData(file:File,max=1400){return await new Promise<string>((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max}if(h>max){w=Math.round(w*max/h);h=max}const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");if(!x)return reject(new Error("Bildfehler"));x.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve(c.toDataURL("image/jpeg",.76))};img.onerror=()=>reject(new Error("Bild konnte nicht gelesen werden."));img.src=url})}

export default function EquipmentManager(){
 const[items,setItems]=useState<Eq[]>([]),[error,setError]=useState(""),[message,setMessage]=useState(""),[ai,setAi]=useState(false),[savingId,setSavingId]=useState("");
 async function load(){try{const b=await fetch("/api/equipment",{cache:"no-store"});const j=await b.json();if(!b.ok)throw new Error(j.error||"Fehler");setItems(j)}catch(e){setError(e instanceof Error?e.message:"Daten konnten nicht geladen werden.")}}
 useEffect(()=>{load()},[]);
 async function recognize(){setError("");setMessage("");const input=document.querySelector<HTMLInputElement>("#equipmentPhoto"),file=input?.files?.[0];if(!file){setError("Bitte zuerst ein Foto aufnehmen oder ein vorhandenes Bild auswählen.");return}setAi(true);try{const image=await imageToData(file);const r=await fetch("/api/ai/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task:"equipment",image})});const j=await r.json();if(!r.ok)throw new Error(j.error||"KI nicht verfügbar.");const d=j.result||{};const form=document.querySelector<HTMLFormElement>("#equipmentForm");if(!form)return;const set=(n:string,v:any)=>{const el=form.elements.namedItem(n) as HTMLInputElement|HTMLSelectElement|null;if(el&&v!==null&&v!==undefined&&String(v)!=="")el.value=String(v)};set("name",[d.manufacturer,d.model].filter(Boolean).join(" ")||d.name);set("serial_number",d.serial_number);set("power_watts",d.power_watts);set("equipment_type",d.equipment_type);set("equipment_code",d.equipment_code_suggestion);setMessage("KI-Vorschlag eingetragen. Bitte Werte prüfen und anschließend speichern.")}catch(e){setError(e instanceof Error?e.message:"KI-Analyse fehlgeschlagen.")}finally{setAi(false)}}
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");setMessage("");const form=e.currentTarget,res=await fetch("/api/equipment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))});const j=await res.json();if(!res.ok){setError(j.error||"Fehler");return}form.reset();setMessage("Gerät wurde angelegt.");await load()}
 async function setStock(x:Eq,next:number){const value=Math.max(0,next);setSavingId(x.id);setError("");try{const r=await fetch("/api/equipment",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:x.id,stock_quantity:value})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Bestand konnte nicht gespeichert werden.");setItems(items=>items.map(i=>i.id===x.id?{...i,stock_quantity:value}:i))}catch(e){setError(e instanceof Error?e.message:"Bestand konnte nicht gespeichert werden.")}finally{setSavingId("")}}
 const label=(t:string|null)=>t==="technical"?"Technische Trocknung":t==="insulation"?"Dämmschichttrocknung":t==="universal"?"Beide Bereiche":"Sonstige";

 return <section className="grid cols2">
  <form id="equipmentForm" className="card" onSubmit={submit}><h2>Gerät anlegen</h2>{error&&<div className="error">{error}</div>}{message&&<div className="notice">{message}</div>}
   <p className="muted small">Der Gerätekatalog gilt gemeinsam für Erhard und Dryland.</p>
   <div className="field" style={{marginTop:12}}><label>Gerät / Typenschild fotografieren oder vorhandenes Bild auswählen</label><input id="equipmentPhoto" type="file" accept="image/*"/></div>
   <button type="button" className="button secondary" onClick={recognize} disabled={ai}>{ai?"KI analysiert …":"KI: Gerät erkennen & Formular ausfüllen"}</button>
   <div className="formGrid" style={{marginTop:12}}>
    <div className="field"><label>Gerätenummer *</label><input name="equipment_code" required placeholder="z. B. TTK-125-S"/></div>
    <div className="field"><label>Bestand</label><input type="number" name="stock_quantity" min="0" defaultValue="1"/></div>
    <div className="field full"><label>Bezeichnung *</label><input name="name" required/></div>
    <div className="field"><label>Kategorie</label><select name="equipment_type" defaultValue="technical"><option value="technical">Technische Trocknung</option><option value="insulation">Dämmschichttrocknung</option><option value="universal">Beide Bereiche</option></select></div>
    <div className="field"><label>Seriennummer</label><input name="serial_number"/></div>
    <div className="field"><label>Leistung Watt</label><input name="power_watts" inputMode="decimal"/></div>
   </div>
   <button className="button success" style={{marginTop:14}}>Gerät speichern</button>
  </form>

  <div className="card"><h2>Vorhandene Geräte</h2><p className="muted small">Hier stellst du ein, wie viele Geräte dieses Modells insgesamt vorhanden sind.</p>
   {items.length===0?<div className="empty">Noch keine Geräte angelegt.</div>:items.map(x=><div key={x.id} className="equipmentStockRow">
    <div><strong>{x.equipment_code} · {x.name}</strong><div className="caseMeta">{label(x.equipment_type)}{x.serial_number?<><br/>Seriennr.: {x.serial_number}</>:null}{x.power_watts?<><br/>{x.power_watts} W</>:null}</div></div>
    <div className="qtyControl" aria-label={`Bestand ${x.name}`}>
     <button type="button" disabled={savingId===x.id||x.stock_quantity<=0} onClick={()=>setStock(x,x.stock_quantity-1)}>−</button>
     <span title="Gesamtbestand">{x.stock_quantity}</span>
     <button type="button" disabled={savingId===x.id} onClick={()=>setStock(x,x.stock_quantity+1)}>+</button>
    </div>
   </div>)}
  </div>
 </section>
}
