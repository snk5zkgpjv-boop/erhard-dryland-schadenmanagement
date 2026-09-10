import {createHash} from "crypto";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {WebStandardStreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {z} from "zod";
import {getSql} from "@/lib/db";
import {audit,ensureOrganizationSchema} from "@/lib/organization";
import {mcpOwnerFromRequest} from "@/lib/mcp-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function iso(value:string,name:string){const d=new Date(value);if(!value||Number.isNaN(d.getTime()))throw new Error(`${name} ist kein gültiger Zeitpunkt.`);return d.toISOString()}
function toCents(value:number|undefined){return value===undefined?null:Math.round(value*100)}
function externalId(input:unknown){return `chatgpt:${createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0,40)}`}
function unauthorized(request:Request){const origin=new URL(request.url).origin;return Response.json({error:"unauthorized",error_description:"Bitte die Organisationszentrale verbinden."},{status:401,headers:{"WWW-Authenticate":`Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp"`}})}

function createServer(ownerId:string){
  const server=new McpServer({name:"erhard-organisationszentrale",version:"1.0.0"},{instructions:"Arbeitszeiten grundsätzlich als prüfbare Entwürfe speichern. Vor dem Speichern alle erkannten Angaben knapp zusammenfassen. Fehlende Start- oder Endzeiten erfragen. Zeitpunkte in Europe/Berlin mit UTC-Offset senden."});
  server.registerTool("create_time_entry_draft",{
    title:"Arbeitszeit als Entwurf speichern",
    description:"Speichert eine diktierte Arbeitszeit in der Organisationszentrale. Erst verwenden, wenn Kunde, Datum, Beginn, Ende und Tätigkeit eindeutig sind.",
    inputSchema:{area:z.enum(["erhard","dryland","ecg","zeiss","family"]).default("erhard"),activity:z.string().min(3).max(1000),customer:z.string().max(300).optional(),location:z.string().max(300).optional(),started_at:z.string().describe("ISO-8601 mit Zeitzone, z. B. 2026-09-10T17:45:00+02:00"),ended_at:z.string().describe("ISO-8601 mit Zeitzone"),travel_minutes:z.number().int().min(0).max(1440).default(0),hourly_rate_eur:z.number().min(0).max(10000).optional(),travel_flat_eur:z.number().min(0).max(10000).optional(),notes:z.string().max(4000).optional(),billable:z.boolean().default(true),external_reference:z.string().max(200).optional()},
    annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false}
  },async input=>{
    await ensureOrganizationSchema();const started=iso(input.started_at,"Beginn"),ended=iso(input.ended_at,"Ende");if(new Date(ended)<=new Date(started))throw new Error("Das Ende muss nach dem Beginn liegen.");
    const ref=input.external_reference?`chatgpt:${input.external_reference}`:externalId({...input,started_at:started,ended_at:ended}),sql=getSql();
    const sunday=new Date(`${input.started_at.slice(0,10)}T12:00:00Z`).getUTCDay()===0,rate=input.hourly_rate_eur??(input.billable&&(input.area==="erhard"||input.area==="dryland")?72:undefined);
    const rows=await sql`INSERT INTO org_time_entries(owner_id,source,area,activity,customer,location,notes,started_at,ended_at,travel_minutes,billable,volunteer,sunday,external_id,approval_status,hourly_rate_cents,travel_flat_cents)
      VALUES(${ownerId},'chatgpt',${input.area},${input.activity},${input.customer||null},${input.location||null},${input.notes||null},${started},${ended},${input.travel_minutes},${input.billable},false,${sunday},${ref},'draft',${toCents(rate)},${toCents(input.travel_flat_eur)})
      ON CONFLICT(owner_id,source,external_id) WHERE external_id IS NOT NULL DO UPDATE SET activity=excluded.activity,customer=excluded.customer,location=excluded.location,notes=excluded.notes,started_at=excluded.started_at,ended_at=excluded.ended_at,travel_minutes=excluded.travel_minutes,billable=excluded.billable,hourly_rate_cents=excluded.hourly_rate_cents,travel_flat_cents=excluded.travel_flat_cents,deleted_at=NULL,updated_at=now() RETURNING *,EXTRACT(EPOCH FROM (ended_at-started_at))/60 AS duration_minutes`;
    const row=rows[0];await audit(ownerId,"time",String(row.id),"chatgpt_draft",row);
    const result={id:String(row.id),status:"draft",activity:row.activity,customer:row.customer,location:row.location,started_at:row.started_at,ended_at:row.ended_at,duration_minutes:Number(row.duration_minutes),hourly_rate_eur:row.hourly_rate_cents==null?null:Number(row.hourly_rate_cents)/100,organization_url:`${process.env.NEXT_PUBLIC_APP_URL||"https://erhard-dryland-schadenmanagement.vercel.app"}/organization`};
    return {structuredContent:{entry:result},content:[{type:"text",text:`Arbeitszeit als Entwurf gespeichert: ${result.activity}, ${result.duration_minutes} Minuten. In der Organisationszentrale prüfen.`}]};
  });
  server.registerTool("list_recent_time_entries",{
    title:"Letzte Arbeitszeiten anzeigen",description:"Zeigt die zuletzt gespeicherten Arbeitszeiten des verbundenen Benutzers.",
    inputSchema:{limit:z.number().int().min(1).max(50).default(10)},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}
  },async({limit})=>{
    await ensureOrganizationSchema();const sql=getSql(),rows=await sql`SELECT id,source,area,activity,customer,location,started_at,ended_at,travel_minutes,approval_status,hourly_rate_cents,travel_flat_cents,EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))/60 AS duration_minutes FROM org_time_entries WHERE owner_id=${ownerId} AND deleted_at IS NULL ORDER BY started_at DESC LIMIT ${limit}`;
    return {structuredContent:{entries:rows},content:[{type:"text",text:`${rows.length} Arbeitszeiten gefunden.`}]};
  });
  return server;
}

async function handle(request:Request){
  const ownerId=await mcpOwnerFromRequest(request);if(!ownerId)return unauthorized(request);
  const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});const server=createServer(ownerId);await server.connect(transport);return transport.handleRequest(request);
}
export const POST=handle;export const GET=handle;export const DELETE=handle;
export async function OPTIONS(){return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS","Access-Control-Allow-Headers":"Authorization,Content-Type,Mcp-Session-Id,Mcp-Protocol-Version,Last-Event-ID","Access-Control-Expose-Headers":"Mcp-Session-Id,Mcp-Protocol-Version"}})}
