import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import styles from "@/components/CaseFormLayout.module.css";

function d(v:any){return v?new Date(v).toLocaleDateString("de-DE"):"–"}

export default async function CaseForms({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","techniker","buero"]);
 const{id}=await params,sql=getSql();
 const c=await sql`SELECT c.*,co.code company_code,co.name company_name,
   cu.first_name,cu.last_name,cu.company_name customer_company_name
   FROM cases c JOIN companies co ON co.id=c.company_id LEFT JOIN customers cu ON cu.id=c.customer_id
   WHERE c.id=${id} LIMIT 1`;
 if(!c.length)return <main className="shell"><h1>Schaden nicht gefunden</h1></main>;
 const [a,reports,energy]=await Promise.all([
  sql`SELECT id,assignment_date FROM assignments WHERE case_id=${id} ORDER BY created_at DESC LIMIT 1`,
  sql`SELECT id,report_date,report_number,worker_name,description FROM work_reports WHERE case_id=${id} ORDER BY report_date DESC,created_at DESC`,
  sql`SELECT id,unit_name,start_date,end_date,consumption_kwh FROM energy_records WHERE case_id=${id} ORDER BY created_at DESC`
 ]);
 const x:any=c[0];
 return <main className="shell">
  <div className="topbar"><Link className="back" href={`/cases/${id}`}>← Zur Schadenakte</Link></div>
  <section className="hero"><span className="pill">{x.company_code}</span><h1>Formulare & Nachweise</h1><p className="muted">{x.title}{x.case_number?` · ${x.case_number}`:""}</p></section>
  <div className={styles.hubGrid}>
   <div className={styles.hubCard}><h2>Auftragserteilung</h2><p>Auftraggeber-, Objekt- und Versicherungsdaten aus der Schadenakte.</p>{a.length?<><p className="muted small">Stand: {d(a[0].assignment_date)}</p><Link className="button" href={`/cases/${id}/assignment/view`}>Auftragserteilung öffnen</Link></>:<p className="muted">Noch nicht gespeichert. Im Reiter „Dokumente“ anlegen.</p>}</div>
   <div className={styles.hubCard}><h2>Rapporte</h2>{reports.length?reports.map((r:any)=><div key={r.id} style={{marginBottom:12}}><strong>{d(r.report_date)} · {r.report_number||"Rapport"}</strong><div className="muted small">{r.worker_name||""}</div><Link className="button secondary" href={`/cases/${id}/work-reports/${r.id}/view`}>Rapport öffnen</Link></div>):<p className="muted">Noch keine Rapporte.</p>}</div>
   <div className={styles.hubCard}><h2>Energieverbrauchsnachweise</h2>{energy.length?energy.map((e:any)=><div key={e.id} style={{marginBottom:12}}><strong>{e.unit_name||"Bereich"}</strong><div className="muted small">{d(e.start_date)} – {d(e.end_date)} · {e.consumption_kwh??"–"} kWh</div><Link className="button secondary" href={`/cases/${id}/energy/${e.id}/view`}>Nachweis öffnen</Link></div>):<p className="muted">Noch keine Energieeinträge.</p>}</div>
  </div>
 </main>
}
