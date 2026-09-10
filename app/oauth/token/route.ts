import {getSql} from "@/lib/db";
import {ensureMcpAuthSchema,pkceChallenge,randomToken,tokenHash} from "@/lib/mcp-auth";

export const runtime="nodejs";
function reply(body:unknown,status=200){return Response.json(body,{status,headers:{"Cache-Control":"no-store","Pragma":"no-cache"}})}
export async function POST(request:Request){
  try{
    await ensureMcpAuthSchema();const form=await request.formData(),grant=String(form.get("grant_type")||""),clientId=String(form.get("client_id")||""),sql=getSql();
    if(grant==="authorization_code"){
      const code=String(form.get("code")||""),verifier=String(form.get("code_verifier")||""),redirectUri=String(form.get("redirect_uri")||"");
      const rows=await sql`UPDATE mcp_oauth_codes SET used_at=now() WHERE code_hash=${tokenHash(code)} AND client_id=${clientId} AND redirect_uri=${redirectUri} AND expires_at>now() AND used_at IS NULL RETURNING owner_id,code_challenge`;
      if(!rows.length||pkceChallenge(verifier)!==String(rows[0].code_challenge))return reply({error:"invalid_grant"},400);
      const access=randomToken(),refresh=randomToken();await sql`INSERT INTO mcp_oauth_tokens(access_token_hash,refresh_token_hash,client_id,owner_id,access_expires_at,refresh_expires_at) VALUES(${tokenHash(access)},${tokenHash(refresh)},${clientId},${String(rows[0].owner_id)},now()+interval '1 hour',now()+interval '90 days')`;
      return reply({access_token:access,token_type:"Bearer",expires_in:3600,refresh_token:refresh,scope:"organization:time:read organization:time:write"});
    }
    if(grant==="refresh_token"){
      const refresh=String(form.get("refresh_token")||""),rows=await sql`SELECT owner_id FROM mcp_oauth_tokens WHERE refresh_token_hash=${tokenHash(refresh)} AND client_id=${clientId} AND refresh_expires_at>now() AND revoked_at IS NULL LIMIT 1`;
      if(!rows.length)return reply({error:"invalid_grant"},400);const access=randomToken();await sql`UPDATE mcp_oauth_tokens SET access_token_hash=${tokenHash(access)},access_expires_at=now()+interval '1 hour',updated_at=now() WHERE refresh_token_hash=${tokenHash(refresh)} AND client_id=${clientId}`;
      return reply({access_token:access,token_type:"Bearer",expires_in:3600,scope:"organization:time:read organization:time:write"});
    }
    return reply({error:"unsupported_grant_type"},400);
  }catch{return reply({error:"server_error"},500)}
}
