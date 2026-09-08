import Link from "next/link";import {requirePageUser} from "@/lib/auth";import DamageReportEditor from "@/components/DamageReportEditor";import CaseMasterEditor from "@/components/CaseMasterEditor";import {getSql} from "@/lib/db";
export default async function EditReportPage({params}:{params:Promise<{id:string}>}){
 await requirePageUser();const{id}=await params;const sql=getSql();
 const rows=await sql`SELECT c.*,co.code AS company_code,co.name AS company_name,
 cu.first_name AS customer_first_name,cu.last_name AS customer_last_name,cu.company_name AS customer_company_name,
 cu.street AS customer_street,cu.postal_code AS customer_postal_code,cu.city AS customer_city,cu.email AS customer_email,cu.phone AS customer_phone
 FROM cases c JOIN companies co ON co.id=c.company_id LEFT JOIN customers cu ON cu.id=c.customer_id WHERE c.id=${id} LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Schaden nicht gefunden</h1></main>;
 return <main className="shell"><div className="topbar"><Link className="back" href={`/cases/${id}`}>← Zur Schadenakte</Link><Link className="button secondary" href={`/cases/${id}/report`}>Bericht ansehen</Link></div>
  <section className="hero"><span className="pill">Bearbeiten</span><h1>Schadensbericht & Stammdaten</h1><p className="muted">Auftraggeber, Schadensort und Berichtsdaten können hier nachträglich geändert werden.</p></section>
  <section className="section"><CaseMasterEditor data={rows[0]} onSaved={()=>{}}/></section>
  <section className="section"><DamageReportEditor caseId={id}/></section>
 </main>
}
