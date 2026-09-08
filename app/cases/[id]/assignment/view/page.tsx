import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import PrintButton from "@/components/CaseFormPrintButton";
import styles from "@/components/CaseFormLayout.module.css";
function date(v:any){return v?new Date(v).toLocaleDateString("de-DE"):""}

export default async function AssignmentView({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","techniker","buero"]);
 const{id}=await params,sql=getSql();
 const rows=await sql`SELECT a.*,c.case_number,c.title,c.object_street,c.object_postal_code,c.object_city,c.damage_description,c.recommended_action,
  co.code company_code,co.name company_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,co.email,co.phone,co.mobile,
  cu.first_name,cu.last_name,cu.company_name customer_company_name,cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city
  FROM assignments a JOIN cases c ON c.id=a.case_id JOIN companies co ON co.id=a.company_id LEFT JOIN customers cu ON cu.id=c.customer_id
  WHERE a.case_id=${id} ORDER BY a.created_at DESC LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Noch keine Auftragserteilung gespeichert.</h1><Link href={`/cases/${id}`}>Zurück</Link></main>;
 const x:any=rows[0],customer=x.customer_company_name||[x.first_name,x.last_name].filter(Boolean).join(" ")||"–";
 return <main className={styles.screen}>
  <div className={`shell noPrint ${styles.toolbar}`}><Link className="back" href={`/cases/${id}/forms`}>← Formulare</Link><PrintButton/></div>
  <article className={styles.sheet}>
   <header className={styles.header}><img src={x.company_code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"} alt="Logo"/><div className={styles.company}><strong>{x.company_name}</strong><br/>{x.company_street||""}<br/>{[x.company_postal_code,x.company_city].filter(Boolean).join(" ")}<br/>{x.email||""}</div></header>
   <h1 className={styles.title}>Auftragserteilung</h1>
   <div className={styles.grid2}>
    <table className={styles.infoTable}><tbody>
     <tr><th>Auftraggeber</th><td>{customer}<br/>{x.customer_street||""}<br/>{[x.customer_postal_code,x.customer_city].filter(Boolean).join(" ")}</td></tr>
     <tr><th>Schadens-/Projekt-Nr.</th><td>{x.case_number||"–"}</td></tr>
    </tbody></table>
    <table className={styles.infoTable}><tbody>
     <tr><th>Schadenort / Objekt</th><td>{x.title||""}<br/>{x.object_street||""}<br/>{[x.object_postal_code,x.object_city].filter(Boolean).join(" ")}</td></tr>
     <tr><th>Datum</th><td>{date(x.assignment_date)}</td></tr>
    </tbody></table>
   </div>
   <h2 className={styles.subTitle}>Beauftragte Maßnahmen</h2><div className={styles.textBox}>{x.scope||x.recommended_action||x.damage_description||"–"}</div>
   <h2 className={styles.subTitle}>Versicherungsdaten</h2>
   <table className={styles.infoTable}><tbody>
    <tr><th>Versicherung</th><td>{x.insurer||"–"}</td></tr><tr><th>Schadennummer</th><td>{x.claim_number||"–"}</td></tr><tr><th>Versicherungsnummer</th><td>{x.insurance_number||"–"}</td></tr>
   </tbody></table>
   <h2 className={styles.subTitle}>Auftragserteilung / Abtretung bei Versicherungsfällen</h2>
   <div className={styles.block}>Der Auftraggeber bestätigt die Beauftragung der oben aufgeführten Maßnahmen. Bei Versicherungsfällen dient dieser Abschnitt zugleich der Zuordnung der Versicherungs- und Schadendaten. Die Unterschrift erfolgt durch den Auftraggeber.</div>
   <div className={styles.signatureGrid}><div className={styles.sigLine}>Ort, Datum</div><div className={styles.sigLine}>Unterschrift Auftraggeber</div></div>
   <footer className={styles.footer}><span>{x.company_name}</span><span>Auftragserteilung</span></footer>
  </article>
 </main>
}
