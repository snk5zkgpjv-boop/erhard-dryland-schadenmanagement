import {ensureMcpAuthSchema,randomToken} from "@/lib/mcp-auth";
import {getSql} from "@/lib/db";

export const runtime="nodejs";
export async function POST(request:Request){
  try{
    await ensureMcpAuthSchema();const body=await request.json();
    const redirectUris=Array.isArray(body.redirect_uris)?body.redirect_uris.map(String):[];
    if(!redirectUris.length||redirectUris.length>10||redirectUris.some((uri:string)=>{try{const u=new URL(uri);return u.protocol!=="https:"&&u.hostname!=="localhost"}catch{return true}}))return Response.json({error:"invalid_redirect_uri"},{status:400});
    const clientId=randomToken(24),name=String(body.client_name||"ChatGPT").slice(0,120),sql=getSql();
    await sql`INSERT INTO mcp_oauth_clients(client_id,client_name,redirect_uris) VALUES(${clientId},${name},${JSON.stringify(redirectUris)}::jsonb)`;
    return Response.json({client_id:clientId,client_name:name,redirect_uris:redirectUris,grant_types:["authorization_code","refresh_token"],response_types:["code"],token_endpoint_auth_method:"none"},{status:201});
  }catch{return Response.json({error:"server_error"},{status:500})}
}
