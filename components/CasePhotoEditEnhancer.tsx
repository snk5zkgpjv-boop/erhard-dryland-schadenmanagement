"use client";
import {useEffect,useState} from "react";

type Photo={
 id:string;category:string;room:string|null;component:string|null;caption:string|null;
 file_url:string;ai_description?:string|null
};

function caseIdFromPath(){
 const m=location.pathname.match(/^\/cases\/([0-9a-fA-F-]{36})(?:\/|$)/);
 return m?.[1]||"";
}
async function compressImage(file:File,max=1400,quality=.78){
 return await new Promise<string>((resolve,reject)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{
   let w=img.width,h=img.height;
   if(w>max){h=Math.round(h*max/w);w=max}
   if(h>max){w=Math.round(w*max/h);h=max}
   const c=document.createElement("canvas");c.width=w;c.height=h;
   const ctx=c.getContext("2d");if(!ctx)return reject(new Error("Bild konnte nicht verarbeitet werden."));
   ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
   resolve(c.toDataURL("image/jpeg",quality))
  };
  img.onerror=()=>reject(new Error("Bild konnte nicht gelesen werden."));
  img.src=url
 })
}

export default function CasePhotoEditEnhancer(){
 const[caseId,setCaseId]=useState("");
 const[photos,setPhotos]=useState<Photo[]>([]);
 const[editing,setEditing]=useState<Photo|null>(null);
 const[busy,setBusy]=useState(false);
 const[err,setErr]=useState("");

 async function load(id=caseId){
  if(!id)return;
  const r=await fetch(`/api/cases/${id}/photos`,{cache:"no-store"});
  const j=await r.json();
  if(r.ok)setPhotos(j)
 }
 useEffect(()=>{
  const id=caseIdFromPath();setCaseId(id);if(id)load(id)
 },[]);

 useEffect(()=>{
  if(!caseId)return;
  function enhance(){
   document.querySelectorAll<HTMLElement>(".photoCard").forEach(card=>{
    if(card.dataset.fullPhotoEdit==="1")return;
    const img=card.querySelector<HTMLImageElement>("img");
    const body=card.querySelector<HTMLElement>(".photoBody");
    if(!img||!body)return;
    const p=photos.find(x=>x.file_url===img.src||img.src.endsWith(x.file_url));
    if(!p)return;

    card.dataset.fullPhotoEdit="1";
    const row=document.createElement("div");
    row.className="actions photoActionRow";

    const edit=document.createElement("button");
    edit.type="button";edit.className="button secondary smallButton";edit.textContent="Foto bearbeiten";
    edit.onclick=()=>setEditing(p);

    const del=document.createElement("button");
    del.type="button";del.className="button dangerButton smallButton";del.textContent="Foto entfernen";
    del.onclick=async()=>{
     if(!confirm("Dieses Foto wirklich aus dem Schadensfall entfernen?"))return;
     del.setAttribute("disabled","true");
     try{
      const r=await fetch(`/api/cases/${caseId}/photos`,{
       method:"DELETE",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({photo_id:p.id})
      });
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Foto konnte nicht gelöscht werden.");
      await load();location.reload()
     }catch(e){alert(e instanceof Error?e.message:"Foto konnte nicht gelöscht werden.");del.removeAttribute("disabled")}
    };
    row.append(edit,del);body.appendChild(row)
   })
  }
  enhance();
  const obs=new MutationObserver(enhance);obs.observe(document.body,{childList:true,subtree:true});
  return()=>obs.disconnect()
 },[caseId,photos]);

 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!editing||!caseId)return;setBusy(true);setErr("");
  try{
   const fd=new FormData(e.currentTarget),body:any=Object.fromEntries(fd.entries());
   const input=e.currentTarget.elements.namedItem("replacement_photo") as HTMLInputElement|null;
   const file=input?.files?.[0];if(file)body.file_url=await compressImage(file);
   delete body.replacement_photo;body.photo_id=editing.id;

   const r=await fetch(`/api/cases/${caseId}/photos`,{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
   });
   const j=await r.json();if(!r.ok)throw new Error(j.error||"Foto konnte nicht gespeichert werden.");
   setEditing(null);await load();location.reload()
  }catch(e){setErr(e instanceof Error?e.message:"Foto konnte nicht gespeichert werden.")}
  finally{setBusy(false)}
 }

 if(!editing)return null;
 return <div className="photoEditBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}>
  <form className="photoEditModal" onSubmit={save}>
   <div className="sectionHeader"><div><h2>Schadensbild bearbeiten</h2><p className="muted small">Angaben ändern, Bild ersetzen oder den Vorgang abbrechen.</p></div><button type="button" className="button secondary smallButton" onClick={()=>setEditing(null)}>Schließen</button></div>
   {err&&<div className="error">{err}</div>}
   <img className="photoEditPreview" src={editing.file_url} alt="Schadensbild"/>
   <div className="formGrid">
    <div className="field"><label>Kategorie</label><select name="category" defaultValue={editing.category||"schadensbild"}><option value="schadensbild">Schadensbild</option><option value="messbild">Messbild</option><option value="objektbild">Objektbild</option><option value="bauteiloeffnung">Bauteilöffnung</option></select></div>
    <div className="field"><label>Raum</label><input name="room" defaultValue={editing.room||""}/></div>
    <div className="field"><label>Bauteil</label><input name="component" defaultValue={editing.component||""}/></div>
    <div className="field full"><label>Beschreibung</label><textarea name="caption" defaultValue={editing.caption||""}/></div>
    <div className="field full"><label>Bild ersetzen (optional)</label><input type="file" name="replacement_photo" accept="image/*"/></div>
   </div>
   <div className="actions"><button className="button success" disabled={busy}>{busy?"Speichere …":"Änderungen speichern"}</button><button type="button" className="button secondary" onClick={()=>setEditing(null)}>Abbrechen</button></div>
  </form>
 </div>
}
