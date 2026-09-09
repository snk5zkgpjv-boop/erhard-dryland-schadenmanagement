"use client";
import {FormEvent,useEffect,useState} from "react";

type Photo={
 id:string;
 category:string;
 room:string|null;
 component:string|null;
 caption:string|null;
 ai_description?:string|null;
 file_url:string;
};

async function compressImage(file:File,max=1400,quality=.78){
 return await new Promise<string>((resolve,reject)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{
   let w=img.width,h=img.height;
   if(w>max){h=Math.round(h*max/w);w=max}
   if(h>max){w=Math.round(w*max/h);h=max}
   const c=document.createElement("canvas");c.width=w;c.height=h;
   const ctx=c.getContext("2d");
   if(!ctx)return reject(new Error("Bild konnte nicht verarbeitet werden."));
   ctx.drawImage(img,0,0,w,h);
   URL.revokeObjectURL(url);
   resolve(c.toDataURL("image/jpeg",quality))
  };
  img.onerror=()=>reject(new Error("Bild konnte nicht gelesen werden."));
  img.src=url
 })
}

const categoryLabel=(c:string)=>{
 if(c==="schadensbild")return "Schadensbild";
 if(c==="bauteiloeffnung")return "Bauteilöffnung";
 if(c==="objektbild")return "Objektbild";
 if(c==="messbild")return "Messbild";
 return c||"Foto"
};

export default function ReportPhotoManager({caseId}:{caseId:string}){
 const[photos,setPhotos]=useState<Photo[]>([]);
 const[editing,setEditing]=useState<Photo|null>(null);
 const[loading,setLoading]=useState(true);
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState("");
 const[err,setErr]=useState("");

 async function load(){
  setLoading(true);setErr("");
  try{
   const r=await fetch(`/api/cases/${caseId}/photos`,{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||"Fotos konnten nicht geladen werden.");
   setPhotos(j)
  }catch(e){setErr(e instanceof Error?e.message:"Fotos konnten nicht geladen werden.")}
  finally{setLoading(false)}
 }

 useEffect(()=>{load()},[caseId]);

 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!editing)return;
  setBusy(true);setErr("");setMsg("");
  try{
   const fd=new FormData(e.currentTarget),body:any=Object.fromEntries(fd.entries());
   const input=e.currentTarget.elements.namedItem("replacement_photo") as HTMLInputElement|null;
   const file=input?.files?.[0];
   if(file)body.file_url=await compressImage(file);
   delete body.replacement_photo;
   body.photo_id=editing.id;

   const r=await fetch(`/api/cases/${caseId}/photos`,{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||"Foto konnte nicht gespeichert werden.");
   setEditing(null);setMsg("Foto geändert.");await load()
  }catch(e){setErr(e instanceof Error?e.message:"Foto konnte nicht gespeichert werden.")}
  finally{setBusy(false)}
 }

 async function remove(p:Photo){
  if(!confirm(`"${categoryLabel(p.category)}" wirklich entfernen?`))return;
  setErr("");setMsg("");
  try{
   const r=await fetch(`/api/cases/${caseId}/photos`,{
    method:"DELETE",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({photo_id:p.id})
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||"Foto konnte nicht gelöscht werden.");
   if(editing?.id===p.id)setEditing(null);
   setMsg("Foto entfernt.");await load()
  }catch(e){setErr(e instanceof Error?e.message:"Foto konnte nicht gelöscht werden.")}
 }

 const reportPhotos=photos.filter(p=>["schadensbild","bauteiloeffnung","objektbild"].includes(p.category));
 const measurementPhotos=photos.filter(p=>p.category==="messbild");

 return <section className="card">
  <div className="sectionHeader">
   <div>
    <h2>Schadensbilder bearbeiten</h2>
    <p className="muted small">Hier können die Bilder, die im Schadensbericht erscheinen, direkt geändert, ersetzt oder entfernt werden.</p>
   </div>
  </div>

  {msg&&<div className="notice">{msg}</div>}
  {err&&<div className="error">{err}</div>}

  {editing&&<form className="reportPhotoEditPanel" onSubmit={save}>
   <div className="sectionHeader">
    <div><h3>Bild bearbeiten</h3><div className="muted small">{categoryLabel(editing.category)}</div></div>
    <button type="button" className="button secondary smallButton" onClick={()=>setEditing(null)}>Schließen</button>
   </div>
   <img className="reportPhotoEditPreview" src={editing.file_url} alt="Foto"/>
   <div className="formGrid">
    <div className="field"><label>Kategorie</label><select name="category" defaultValue={editing.category}>
     <option value="schadensbild">Schadensbild</option>
     <option value="bauteiloeffnung">Bauteilöffnung</option>
     <option value="objektbild">Objektbild</option>
     <option value="messbild">Messbild</option>
    </select></div>
    <div className="field"><label>Raum</label><input name="room" defaultValue={editing.room||""}/></div>
    <div className="field"><label>Bauteil</label><input name="component" defaultValue={editing.component||""}/></div>
    <div className="field full"><label>Beschreibung</label><textarea name="caption" defaultValue={editing.caption||""}/></div>
    <div className="field full"><label>Bild ersetzen (optional)</label><input type="file" name="replacement_photo" accept="image/*"/></div>
   </div>
   <div className="actions">
    <button className="button success" disabled={busy}>{busy?"Speichere …":"Änderungen speichern"}</button>
    <button type="button" className="button dangerButton" onClick={()=>remove(editing)}>Foto entfernen</button>
   </div>
  </form>}

  <h3 style={{marginTop:14}}>Bilder im Schadensbericht</h3>
  {loading?<div className="empty">Lade Bilder …</div>:reportPhotos.length===0?<div className="empty">Keine Schadensbilder vorhanden.</div>:
   <div className="reportPhotoManagerGrid">{reportPhotos.map(p=><div className="reportPhotoManageCard" key={p.id}>
    <img src={p.file_url} alt={p.caption||categoryLabel(p.category)}/>
    <div className="reportPhotoManageBody">
     <strong>{categoryLabel(p.category)}</strong>
     <div className="caseMeta">{[p.room,p.component].filter(Boolean).join(" · ")||"Kein Raum/Bauteil"}<br/>{p.caption||""}</div>
     <div className="actions">
      <button type="button" className="button secondary smallButton" onClick={()=>setEditing(p)}>Bearbeiten</button>
      <button type="button" className="button dangerButton smallButton" onClick={()=>remove(p)}>Entfernen</button>
     </div>
    </div>
   </div>)}</div>}

  {measurementPhotos.length>0&&<>
   <div className="divider"/>
   <h3>Messbilder</h3>
   <p className="muted small">Messbilder können hier ebenfalls bearbeitet werden. Die dazugehörige Messung bleibt beim Entfernen des Bildes bestehen.</p>
   <div className="reportPhotoManagerGrid">{measurementPhotos.map(p=><div className="reportPhotoManageCard" key={p.id}>
    <img src={p.file_url} alt={p.caption||"Messbild"}/>
    <div className="reportPhotoManageBody">
     <strong>Messbild</strong>
     <div className="caseMeta">{[p.room,p.component].filter(Boolean).join(" · ")||"Kein Raum/Bauteil"}<br/>{p.caption||""}</div>
     <div className="actions">
      <button type="button" className="button secondary smallButton" onClick={()=>setEditing(p)}>Bearbeiten</button>
      <button type="button" className="button dangerButton smallButton" onClick={()=>remove(p)}>Entfernen</button>
     </div>
    </div>
   </div>)}</div>
  </>}
 </section>
}
