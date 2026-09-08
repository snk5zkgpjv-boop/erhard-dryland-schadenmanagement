import { sql } from "@/lib/db";

export async function GET() {
  try {
    const db = sql();
    const rows = await db`SELECT now() as now`;
    return Response.json({ ok: true, database: rows[0] });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown database error" },
      { status: 500 }
    );
  }
}
