import {createHash,timingSafeEqual} from "crypto";
import {ensureOrganizationSchema} from "@/lib/organization";
import {importEcgTimes,resolveEcgOwner} from "@/lib/ecg-sync";
import {validEcgEntries} from "@/lib/ecg-contract";

export const runtime="nodejs";
function validToken(request:Request){
 const expected=process.env.ORGANIZATION_SYNC_TOKEN||"",actual=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 return !!expected&&!!actual&&timingSafeEqual(createHash("sha256").update(expected).digest(),createHash("sha256").update(actual).digest());
}
export async function POST(request:Request){
 if(!validToken(request))return Response.json({error:"Ungültiger Synchronisationsschlüssel."},{status:401});
 try{
  await ensureOrganizationSchema();
  const body=await request.json(),ownerEmail=String(body.ownerEmail||"").trim().toLowerCase();
  if(!ownerEmail||!Array.isArray(body.entries)||body.entries.length>1000)return Response.json({error:"Ungültige Synchronisationsdaten."},{status:400});
  const entries=validEcgEntries(body.entries);
  let ownerId:string;
  try{ownerId=await resolveEcgOwner(ownerEmail,entries);}catch{return Response.json({error:"Kein eindeutiges Organisationskonto gefunden."},{status:503});}
  const result=await importEcgTimes(ownerId,entries);
  return Response.json({ok:true,...result});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"ECG-Synchronisierung fehlgeschlagen."},{status:500});}
}
