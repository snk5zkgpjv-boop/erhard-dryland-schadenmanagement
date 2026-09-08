import {getSql} from "@/lib/db";
export async function GET(){try{const sql=getSql();const rows=await sql`SELECT id,code,name FROM companies ORDER BY CASE WHEN code='ERHARD' THEN 1 WHEN code='DRYLAND' THEN 2 ELSE 3 END,name`;return Response.json(rows)}catch(error){return Response.json({error:error instanceof Error?error.message:"Firmen konnten nicht geladen werden."},{status:500})}}
