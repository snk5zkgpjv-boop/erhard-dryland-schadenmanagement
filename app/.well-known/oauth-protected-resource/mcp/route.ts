export const runtime="nodejs";
export async function GET(request:Request){
  const origin=new URL(request.url).origin;
  return Response.json({resource:`${origin}/mcp`,authorization_servers:[origin],bearer_methods_supported:["header"],scopes_supported:["organization:time:read","organization:time:write"]});
}
