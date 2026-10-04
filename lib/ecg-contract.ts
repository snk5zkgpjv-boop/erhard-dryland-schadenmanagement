export function validEcgEntries(value:unknown):any[]{
 if(!Array.isArray(value))throw new Error("Ungültige ECG-Zeitliste.");
 const ids=new Set<string>();
 return value.map(e=>{
  if(!e||typeof e.id!=="string"||!e.id||ids.has(e.id)||!Number.isFinite(Date.parse(e.start))||!Number.isFinite(Date.parse(e.end))||Date.parse(e.end)<=Date.parse(e.start)||Date.parse(e.end)>Date.now())throw new Error("Ungültige oder doppelte ECG-Zeitbuchung.");
  ids.add(e.id);return e;
 });
}
export function uniqueEcgOwner(exact:any[],historical:any[]):string|null{
 // A previous verified import is evidence of the link; never pick an arbitrary administrator.
 if(exact.length===1)return historical.some(u=>String(u.id)!==String(exact[0].id))?null:String(exact[0].id);
 if(exact.length>1)return null;
 return historical.length===1?String(historical[0].id):null;
}
