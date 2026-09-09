"use client";

import {useEffect,useMemo,useState} from "react";
import {createPortal} from "react-dom";

type Photo={
 id:string;
 category:string;
 room:string|null;
 component:string|null;
 caption:string|null;
 file_url:string;
 ai_description?:string|null;
};

function caseIdFromPath(){
 if(typeof window==="undefined")return "";
 const m=window.location.pathname.match(/^\/cases\/([0-9a-fA-F-]{36})(?:\/|$)/);
 return m?.[1]||"";
}

async function compressImage(file:File,max=1400,quality=.78){
 return await new Promise<string>((resolve,reject)=>{
  const img=new Image();
  const url=URL.createObjectURL(file);
  img.onload=()=>{
   let w=img.width,h=img.height;
   if(w>max){h=Math.round(h*max/w);w=max}
   if(h>max){w=Math.round(w*max/h);h=max}
   const c=document.createElement("canvas");
   c.width=w;c.height=h;
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

function sameUrl(a:string,b:string){
 if(!a||!b)return false;
 if(a===b)return true;
 try{
  const ua=new URL(a,window.location.origin);
  const ub=new URL(b,window.location.origin);
  return ua.pathname===ub.pathname&&ua.search===ub.search
 }catch{
  return a.endsWith(b)||b.endsWith(a)
 }
}

export default function CasePhotoEditEnhancer(){
 const[caseId,setCaseId]=useState("");
 const[photos,setPhotos]=useState<Photo[]>([]);
 const[targets,setTargets]=useState<HTMLElement[]>([]);
 const[editing,setEditing]=useState<Photo|null>(null);
 const[busy,setBusy]=useState(false);
 const[err,setErr]=useState("");

 async function load(id:string){
  if(!id)return;
  const r=await fetch(`/api/cases/${id}/photos`,{cache:"no-store"});
  const j=await r.json().catch(()=>[]);
  if(r.ok&&Array.isArray(j))setPhotos(j)
 }

 useEffect(()=>{
  const id=caseIdFromPath();
  setCaseId(id);
  if(id)load(id)
 },[]);

 // Wir suchen nur die vorhandenen React-Fotokarten.
 // Die Buttons selbst werden NICHT mehr per document.createElement eingefügt,
 // sondern als echte React-Portals gerendert.
 useEffect(()=>{
  if(!caseId)return;

  function scan(){
   const next=Array.from(document.querySelectorAll<HTMLElement>(".photoCard .photoBody"));
   setTargets(prev=>{
    if(prev.length===next.length&&prev.every((x,i)=>x===next[i]))return prev;
    return next
   })
  }

  scan();
  const obs=new MutationObserver(()=>requestAnimationFrame(scan));
  obs.observe(document.body,{childList:true,subtree:true});
  const timer=window.setInterval(scan,1000);

  return()=>{
   obs.disconnect();
   window.clearInterval(timer)
  }
 },[caseId]);

 const mapped=useMemo(()=>{
  return targets.map((target,index)=>{
   const card=target.closest(".photoCard");
   const img=card?.querySelector<HTMLImageElement>("img");
   const p=(img?photos.find(x=>sameUrl(img.src,x.file_url)):undefined)||photos[index];
   return {target,p}
  }).filter((x):x is {target:HTMLElement,p:Photo}=>Boolean(x.p))
 },[targets,photos]);

 async function remove(p:Photo){
  if(!caseId||!confirm("Dieses Foto wirklich aus dem Schadensfall entfernen?"))return;
  try{
   const r=await fetch(`/api/cases/${caseId}/photos`,{
    method:"DELETE",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({photo_id:p.id})
   });
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||"Foto konnte nicht gelöscht werden.");
   if(editing?.id===p.id)setEditing(null);
   await load(caseId);
   window.location.reload()
  }catch(e){
   alert(e instanceof Error?e.message:"Foto konnte nicht gelöscht werden.")
  }
 }

 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!editing||!caseId)return;
  setBusy(true);setErr("");
  try{
   const fd=new FormData(e.currentTarget);
   const body:any=Object.fromEntries(fd.entries());
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
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||"Foto konnte nicht gespeichert werden.");

   setEditing(null);
   await load(caseId);
   window.location.reload()
  }catch(e){
   setErr(e instanceof Error?e.message:"Foto konnte nicht gespeichert werden.")
  }finally{
   setBusy(false)
  }
 }

 if(!caseId)return null;

 return <>
  {mapped.map(({target,p})=>createPortal(
   <div className="photoActionRow" data-photo-id={p.id} key={p.id}>
    <button type="button" className="button secondary smallButton" onClick={()=>setEditing(p)}>
     Bearbeiten
    </button>
    <button type="button" className="button dangerButton smallButton" onClick={()=>remove(p)}>
     Entfernen
    </button>
   </div>,
   target,
   p.id
  ))}

  {editing&&<div className="photoEditBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}>
   <form className="photoEditModal" onSubmit={save}>
    <div className="sectionHeader">
     <div>
      <h2>Schadensbild bearbeiten</h2>
      <p className="muted small">Raum, Bauteil, Beschreibung, Kategorie oder Bild ändern.</p>
     </div>
     <button type="button" className="button secondary smallButton" onClick={()=>setEditing(null)}>
      Schließen
     </button>
    </div>

    {err&&<div className="error">{err}</div>}

    <img className="photoEditPreview" src={editing.file_url} alt={editing.caption||"Foto"}/>

    <div className="formGrid">
     <div className="field">
      <label>Kategorie</label>
      <select name="category" defaultValue={editing.category||"schadensbild"}>
       <option value="schadensbild">Schadensbild</option>
       <option value="messbild">Messbild</option>
       <option value="objektbild">Objektbild</option>
       <option value="bauteiloeffnung">Bauteilöffnung</option>
      </select>
     </div>

     <div className="field">
      <label>Raum</label>
      <input name="room" defaultValue={editing.room||""}/>
     </div>

     <div className="field">
      <label>Bauteil</label>
      <input name="component" defaultValue={editing.component||""}/>
     </div>

     <div className="field full">
      <label>Beschreibung</label>
      <textarea name="caption" defaultValue={editing.caption||""}/>
     </div>

     <div className="field full">
      <label>Bild ersetzen (optional)</label>
      <input type="file" name="replacement_photo" accept="image/*"/>
     </div>
    </div>

    <div className="actions">
     <button className="button success" disabled={busy}>
      {busy?"Speichere …":"Änderungen speichern"}
     </button>
     <button type="button" className="button dangerButton" onClick={()=>remove(editing)}>
      Foto entfernen
     </button>
     <button type="button" className="button secondary" onClick={()=>setEditing(null)}>
      Abbrechen
     </button>
    </div>
   </form>
  </div>}
 </>
}
