import {currentUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import {ensureMcpAuthSchema,randomToken,tokenHash} from "@/lib/mcp-auth";

export const runtime="nodejs";
function escapeHtml(v:string){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!))}
async function validClient(clientId:string,redirectUri:string){
  const sql=getSql(),rows=await sql`SELECT client_name,redirect_uris FROM mcp_oauth_clients WHERE client_id=${clientId} LIMIT 1`;if(!rows.length)return null;
  const uris=Array.isArray(rows[0].redirect_uris)?rows[0].redirect_uris:JSON.parse(String(rows[0].redirect_uris));return uris.includes(redirectUri)?String(rows[0].client_name):null;
}
export async function GET(request:Request){
  await ensureMcpAuthSchema();const url=new URL(request.url),q=url.searchParams;
  const clientId=q.get("client_id")||"",redirectUri=q.get("redirect_uri")||"",state=q.get("state")||"",challenge=q.get("code_challenge")||"";
  if(q.get("response_type")!=="code"||q.get("code_challenge_method")!=="S256"||challenge.length<43)return Response.json({error:"invalid_request"},{status:400});
  const clientName=await validClient(clientId,redirectUri);if(!clientName)return Response.json({error:"invalid_client"},{status:400});
  const user=await currentUser();if(!user){const next=url.pathname+url.search;return Response.redirect(`${url.origin}/login?next=${encodeURIComponent(next)}`)}
  const hidden={client_id:clientId,redirect_uri:redirectUri,state,code_challenge:challenge,scope:q.get("scope")||"organization:time:read organization:time:write"};
  const inputs=Object.entries(hidden).map(([k,v])=>`<input type="hidden" name="${k}" value="${escapeHtml(v)}">`).join("");
  return new Response(`<!doctype html><html lang="de"><meta name="viewport" content="width=device-width"><title>Organisationszentrale verbinden</title><style>body{font-family:system-ui;background:#eef4fb;color:#17324d;margin:0;padding:24px}.card{max-width:520px;margin:8vh auto;background:white;border-radius:18px;padding:28px;box-shadow:0 12px 40px #17324d22}h1{font-size:24px}.ok{background:#edf8f1;padding:14px;border-radius:10px}button{width:100%;padding:14px;border:0;border-radius:10px;background:#1769aa;color:white;font-weight:700;font-size:16px}</style><div class="card"><h1>Organisationszentrale verbinden</h1><p><strong>${escapeHtml(clientName)}</strong> darf für <strong>${escapeHtml(user.display_name)}</strong> Arbeitszeiten lesen und neue Einträge als prüfbare Entwürfe anlegen.</p><p class="ok">Kennwort, Finanzen, Dokumente und andere Benutzerbereiche werden nicht freigegeben.</p><form method="post">${inputs}<button type="submit">Sicher verbinden</button></form></div></html>`,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
export async function POST(request:Request){
  await ensureMcpAuthSchema();const user=await currentUser();if(!user)return Response.json({error:"login_required"},{status:401});
  const form=await request.formData(),clientId=String(form.get("client_id")||""),redirectUri=String(form.get("redirect_uri")||""),state=String(form.get("state")||""),challenge=String(form.get("code_challenge")||"");
  if(!await validClient(clientId,redirectUri)||challenge.length<43)return Response.json({error:"invalid_request"},{status:400});
  const code=randomToken(),sql=getSql();await sql`INSERT INTO mcp_oauth_codes(code_hash,client_id,owner_id,redirect_uri,code_challenge,expires_at) VALUES(${tokenHash(code)},${clientId},${user.id},${redirectUri},${challenge},now()+interval '5 minutes')`;
  const target=new URL(redirectUri);target.searchParams.set("code",code);if(state)target.searchParams.set("state",state);return Response.redirect(target,303);
}
