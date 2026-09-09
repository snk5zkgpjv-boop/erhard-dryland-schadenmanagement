import {ImapFlow} from "imapflow";
import {getSql} from "@/lib/db";
import {decryptSecret,ensureOrganizationSchema,requestOwnerId} from "@/lib/organization";

export const runtime="nodejs";
const hosts:Record<string,string>={gmail:"imap.gmail.com",outlook:"outlook.office365.com","all-inkl":"imap.kasserver.com",strato:"imap.strato.de",gmx:"imap.gmx.net"};
function classify(subject:string,preview:string){
  const text=`${subject} ${preview}`.toLowerCase();
  const urgent=/frist|mahnung|störung|ausfall|dringend|zahlung fällig|terminänderung/.test(text);
  const appointment=/termin|treffen|besprechung|einladung|kalender|uhr/.test(text);
  return {relevance:urgent?"urgent":appointment?"important":"normal",suggested_action:appointment?"Termin prüfen und übernehmen":urgent?"Zeitnah bearbeiten":null};
}
export async function POST(request:Request){
  let client:ImapFlow|null=null;
  try{
    const ownerId=requestOwnerId(request);await ensureOrganizationSchema();const body=await request.json(),id=String(body.id||"");const sql=getSql();
    const rows=await sql`SELECT * FROM org_mail_accounts WHERE id=${id} AND owner_id=${ownerId} AND deleted_at IS NULL LIMIT 1`;const account=rows[0] as any;
    if(!account)return Response.json({error:"E-Mail-Konto nicht gefunden."},{status:404});if(account.connection_type!=="imap")return Response.json({error:"OAuth wird nach Hinterlegung der Anbieter-Zugangsdaten aktiviert. Bis dahin bitte IMAP/App-Passwort verwenden."},{status:409});if(!account.encrypted_secret)return Response.json({error:"Bitte zuerst ein App-Passwort hinterlegen."},{status:409});
    const host=account.host||hosts[account.provider];if(!host)return Response.json({error:"Bitte den IMAP-Server eintragen."},{status:400});
    client=new ImapFlow({host,port:Number(account.port||993),secure:account.security!=="starttls",auth:{user:account.email,pass:decryptSecret(account.encrypted_secret)},logger:false});
    await client.connect();const lock=await client.getMailboxLock("INBOX");let imported=0;
    try{
      const found=await client.search({seen:false},{uid:true}),uids=(found||[]).slice(-25);
      if(uids.length)for await(const message of client.fetch(uids,{uid:true,envelope:true,source:{maxLength:10000}},{uid:true})){
        const subject=message.envelope?.subject||"(ohne Betreff)",sender=message.envelope?.from?.map(x=>x.address||x.name).filter(Boolean).join(", ")||"",preview=message.source?.toString("utf8").replace(/\s+/g," ").slice(0,600)||"",classification=classify(subject,preview),externalId=String(message.uid);
        await sql`INSERT INTO org_mail_items(owner_id,account_id,external_id,sender,subject,received_at,preview,relevance,suggested_action) VALUES(${ownerId},${id},${externalId},${sender},${subject},${message.envelope?.date||null},${preview},${classification.relevance},${classification.suggested_action}) ON CONFLICT(account_id,external_id) DO UPDATE SET sender=excluded.sender,subject=excluded.subject,received_at=excluded.received_at,preview=excluded.preview,relevance=excluded.relevance,suggested_action=excluded.suggested_action`;
        imported++;
      }
    }finally{lock.release()}
    await client.logout();client=null;await sql`UPDATE org_mail_accounts SET last_sync_at=now(),status='connected',sync_enabled=true,updated_at=now() WHERE id=${id}`;
    return Response.json({ok:true,imported,message:imported?`${imported} neue oder ungelesene E-Mails geprüft.`:"Keine ungelesenen E-Mails gefunden."});
  }catch(error){if(client)await client.logout().catch(()=>{});return Response.json({error:error instanceof Error?error.message:"E-Mail-Abruf fehlgeschlagen."},{status:500})}
}
