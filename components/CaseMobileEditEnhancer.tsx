"use client";
import {useEffect} from "react";

function caseIdFromPath(){
 const m=location.pathname.match(/^\/cases\/([0-9a-fA-F-]{36})(?:\/|$)/);
 return m?.[1]||"";
}
async function removePhoto(caseId:string,fileUrl:string){
 const r=await fetch(`/api/cases/${caseId}/photos`,{
  method:"DELETE",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({file_url:fileUrl})
 });
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||"Foto konnte nicht gelöscht werden.");
}

export default function CaseMobileEditEnhancer(){
 useEffect(()=>{
  const caseId=caseIdFromPath();if(!caseId)return;

  let selectedMeasurementPhoto="";
  const clickCapture=(ev:Event)=>{
   const el=ev.target as HTMLElement;
   const btn=el.closest("button");
   if(btn?.textContent?.trim()==="Bearbeiten"){
    const row=btn.closest("tr");
    selectedMeasurementPhoto=(row?.querySelector<HTMLImageElement>("img.miniPhoto")?.src)||"";
   }
  };
  document.addEventListener("click",clickCapture,true);

  function enhancePhotos(){
   document.querySelectorAll<HTMLElement>(".photoCard").forEach(card=>{
    if(card.dataset.deleteEnhanced==="1")return;
    const img=card.querySelector<HTMLImageElement>("img");
    const body=card.querySelector<HTMLElement>(".photoBody");
    if(!img||!body)return;
    card.dataset.deleteEnhanced="1";
    const b=document.createElement("button");
    b.type="button";
    b.className="button dangerButton smallButton photoDeleteButton";
    b.textContent="Foto entfernen";
    b.onclick=async()=>{
     if(!confirm("Dieses Foto wirklich aus dem Schadensfall entfernen?"))return;
     b.setAttribute("disabled","true");
     try{await removePhoto(caseId,img.src);card.remove();location.reload()}
     catch(e){alert(e instanceof Error?e.message:"Foto konnte nicht gelöscht werden.");b.removeAttribute("disabled")}
    };
    body.appendChild(b);
   });
  }

  function enhanceMeasurementEditor(){
   const panel=document.querySelector<HTMLElement>(".editPanel");
   if(!panel||panel.dataset.photoEnhanced==="1")return;
   panel.dataset.photoEnhanced="1";

   // Die Bearbeitungsmaske wird auf dem Handy direkt sichtbar gemacht.
   panel.scrollIntoView({behavior:"smooth",block:"start"});

   if(selectedMeasurementPhoto){
    const field=document.createElement("div");
    field.className="measurementCurrentPhoto";
    field.innerHTML=`<strong>Aktuelles Messfoto</strong><img src="${selectedMeasurementPhoto}" alt="Aktuelles Messfoto">`;
    const remove=document.createElement("button");
    remove.type="button";
    remove.className="button dangerButton smallButton";
    remove.textContent="Messfoto entfernen";
    remove.onclick=async()=>{
     if(!confirm("Das Messfoto entfernen? Die Messung selbst bleibt erhalten."))return;
     remove.setAttribute("disabled","true");
     try{await removePhoto(caseId,selectedMeasurementPhoto);selectedMeasurementPhoto="";location.reload()}
     catch(e){alert(e instanceof Error?e.message:"Messfoto konnte nicht gelöscht werden.");remove.removeAttribute("disabled")}
    };
    field.appendChild(remove);
    const actions=panel.querySelector(".actions");
    panel.insertBefore(field,actions||null);
   }
  }

  const observer=new MutationObserver(()=>{enhancePhotos();enhanceMeasurementEditor()});
  observer.observe(document.body,{childList:true,subtree:true});
  enhancePhotos();enhanceMeasurementEditor();

  return()=>{observer.disconnect();document.removeEventListener("click",clickCapture,true)}
 },[]);
 return null
}
