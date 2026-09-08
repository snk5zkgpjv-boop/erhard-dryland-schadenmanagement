import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import PrintButton from "@/components/CaseFormPrintButton";
import styles from "@/components/CaseFormLayout.module.css";
function date(v:any){return v?new Date(v).toLocaleDateString("de-DE"):"–"}
function time(v:any){return v?String(v).slice(0,5):"–"}

export default async function WorkReportView({params}:{params:Promise<{id:string,reportId:string}>}){
 await requirePageUser(["admin","techniker","buero"]);
 const{id,reportId}=await params,sql=getSql();
 const rows=await sql`SELECT w.*,c.case_number,c.title,c.object_street,c.object_postal_code,c.object_city,c.insurer,c.claim_number,
  co.code company_code,co.name company_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,co.email,co.phone,co.mobile,
  cu.first_name,cu.last_name,cu.company_name customer_company_name
  FROM work_reports w JOIN cases c ON c.id=w.case_id JOIN companies co ON co.id=w.company_id LEFT JOIN customers cu ON cu.id=c.customer_id
  WHERE w.id=${reportId} AND w.case_id=${id} LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Rapport nicht gefunden.</h1></main>;
 const x:any=rows[0],items=await sql`SELECT * FROM work_report_items WHERE work_report_id=${reportId} ORDER BY created_at`;
 const equipment=items.filter((i:any)=>i.item_type==="equipment"),materials=items.filter((i:any)=>i.item_type==="material");
 const customer=x.customer_company_name||[x.first_name,x.last_name].filter(Boolean).join(" ")||"–";
 return <main className={styles.screen}>
  <div className={`shell noPrint ${styles.toolbar}`}><Link className="back" href={`/cases/${id}/forms`}>← Formulare</Link><PrintButton/></div>
  <article className={styles.sheet}>
   <header className={styles.header}><img src={x.company_code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"} alt="Logo"/><div className={styles.company}><strong>{x.company_name}</strong><br/>{x.company_street||""}<br/>{[x.company_postal_code,x.company_city].filter(Boolean).join(" ")}<br/>{x.email||""}</div></header>
   <h1 className={styles.title}>Rapport / Arbeitsnachweis</h1>
   <div className={styles.grid2}>
    <table className={styles.infoTable}><tbody>
     <tr><th>Projekt / Schaden</th><td>{x.case_number||"–"} · {x.title||""}</td></tr>
     <tr><th>Adresse</th><td>{x.object_street||""}<br/>{[x.object_postal_code,x.object_city].filter(Boolean).join(" ")}</td></tr>
     <tr><th>Auftraggeber</th><td>{customer}</td></tr>
    </tbody></table>
    <table className={styles.infoTable}><tbody>
     <tr><th>Rapport-Nr.</th><td>{x.report_number||"–"}</td></tr>
     <tr><th>Datum</th><td>{date(x.report_date)}</td></tr>
     <tr><th>Mitarbeiter</th><td>{x.worker_name||"–"}{x.function?` · ${x.function}`:""}</td></tr>
    </tbody></table>
   </div>

   <h2 className={styles.subTitle}>Arbeitszeit / Fahrzeug</h2>
   <table className={styles.infoTable}><tbody>
    <tr><th>Arbeitsbeginn</th><td>{time(x.work_start)}</td><th>Arbeitsende</th><td>{time(x.work_end)}</td></tr>
    <tr><th>Pause</th><td>{x.break_minutes??0} Min.</td><th>An-/Abfahrten</th><td>{x.trips_count??0}</td></tr>
    <tr><th>Fahrzeuge</th><td colSpan={3}>{x.vehicle_count??0}</td></tr>
   </tbody></table>

   <h2 className={styles.subTitle}>Ausgeführte Arbeiten / Leistungsbeschreibung</h2><div className={styles.textBox}>{x.description||"–"}</div>
   {x.follow_up_work&&<><h2 className={styles.subTitle}>Weitere / nachfolgende Arbeiten</h2><div className={styles.textBox}>{x.follow_up_work}</div></>}

   <div className={styles.grid2}>
    <div><h2 className={styles.subTitle}>Geräte</h2><table className={styles.listTable}><thead><tr><th>Gerät</th><th>Menge</th></tr></thead><tbody>{equipment.length?equipment.map((i:any)=><tr key={i.id}><td>{i.equipment_code||i.description}</td><td>{i.quantity??""} {i.unit||""}</td></tr>):<tr><td colSpan={2}>Keine Gerätepositionen gespeichert.</td></tr>}</tbody></table></div>
    <div><h2 className={styles.subTitle}>Material</h2><table className={styles.listTable}><thead><tr><th>Material</th><th>Menge</th></tr></thead><tbody>{materials.length?materials.map((i:any)=><tr key={i.id}><td>{i.material_name||i.description}</td><td>{i.quantity??""} {i.unit||""}</td></tr>):<tr><td colSpan={2}>Keine Materialpositionen gespeichert.</td></tr>}</tbody></table></div>
   </div>

   <div className={styles.signatureGrid}>
    <div>{x.customer_signature_url?<img src={x.customer_signature_url} alt="Unterschrift Auftraggeber" style={{maxWidth:"65mm",maxHeight:"22mm"}}/>:null}<div className={styles.sigLine}>Unterschrift Auftraggeber</div></div>
    <div>{x.worker_signature_url?<img src={x.worker_signature_url} alt="Unterschrift Mitarbeiter" style={{maxWidth:"65mm",maxHeight:"22mm"}}/>:null}<div className={styles.sigLine}>Unterschrift Mitarbeiter / Techniker</div></div>
   </div>
   <footer className={styles.footer}><span>{x.company_name}</span><span>Rapport {x.report_number||""}</span></footer>
  </article>
 </main>
}
