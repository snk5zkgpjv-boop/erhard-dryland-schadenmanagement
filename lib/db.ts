import { neon } from "@neondatabase/serverless";
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht konfiguriert.");
  return neon(url);
}
