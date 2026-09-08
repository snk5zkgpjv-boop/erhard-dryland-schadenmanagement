import {getSql} from "@/lib/db";
export async function GET(){try{const sql=getSql();const rows=await sql`SELECT now() as now`;return Response.json({ok:true,database:rows[0]})}catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:"Unbekannter Datenbankfehler"},{status:500})}}
