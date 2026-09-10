import {NextRequest,NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";

const PUBLIC_PREFIXES=["/login","/setup","/reset-password","/api/auth","/api/health","/api/organization/voice","/api/organization/ecg-sync"];
function isPublic(path:string){return PUBLIC_PREFIXES.some(p=>path===p||path.startsWith(p+"/"))}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,"0")).join("")}

export async function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(isPublic(path))return NextResponse.next();
  const token=req.cookies.get("schaden_session")?.value;
  const api=path.startsWith("/api/");
  if(!token){
    if(api)return NextResponse.json({error:"Nicht angemeldet."},{status:401});
    const u=req.nextUrl.clone();u.pathname="/login";u.searchParams.set("next",path);return NextResponse.redirect(u);
  }
  try{
    const db=process.env.DATABASE_URL;if(!db)throw new Error("DATABASE_URL fehlt");
    const sql=neon(db);const hash=await sha256(token);
    const rows=await sql`SELECT u.id,u.username,u.display_name,u.role
      FROM app_sessions s JOIN app_users u ON u.id=s.user_id
      WHERE s.token_hash=${hash} AND s.expires_at>now() AND u.active=true LIMIT 1`;
    if(!rows.length)throw new Error("session");
    const userId=String(rows[0].id);

    const caseMatch=path.match(/^\/(?:api\/)?cases\/([0-9a-fA-F-]{36})(?:\/|$)/);
    if(caseMatch){
      const caseId=caseMatch[1];
      const allowed=await sql`SELECT 1
        FROM cases ca
        JOIN app_user_companies auc ON auc.company_id=ca.company_id
        WHERE ca.id=${caseId} AND auc.user_id=${userId}
        LIMIT 1`;
      if(!allowed.length){
        if(api)return NextResponse.json({error:"Kein Zugriff auf diesen Schadensfall."},{status:403});
        const u=req.nextUrl.clone();u.pathname="/";u.search="";return NextResponse.redirect(u);
      }
    }

    const documentMatch=path.match(/^\/(?:api\/)?documents\/([0-9a-fA-F-]{36})(?:\/|$)/);
    if(documentMatch){
      const documentId=documentMatch[1];
      const allowed=await sql`SELECT 1
        FROM documents d
        JOIN app_user_companies auc ON auc.company_id=d.company_id
        WHERE d.id=${documentId} AND auc.user_id=${userId}
        LIMIT 1`;
      if(!allowed.length){
        if(api)return NextResponse.json({error:"Kein Zugriff auf dieses Dokument."},{status:403});
        const u=req.nextUrl.clone();u.pathname="/documents";u.search="";return NextResponse.redirect(u);
      }
    }

    const h=new Headers(req.headers);
    h.set("x-app-user-id",userId);
    h.set("x-app-username",String(rows[0].username));
    h.set("x-app-display-name",String(rows[0].display_name));
    h.set("x-app-role",String(rows[0].role));
    return NextResponse.next({request:{headers:h}});
  }catch{
    if(api)return NextResponse.json({error:"Sitzung ungültig oder Benutzerverwaltung noch nicht eingerichtet."},{status:401});
    const u=req.nextUrl.clone();u.pathname="/login";return NextResponse.redirect(u);
  }
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|erhard-logo.png|dryland-logo.png|organization-app-icon.png).*)"]};
